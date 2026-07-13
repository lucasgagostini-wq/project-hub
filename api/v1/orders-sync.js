// Vercel Serverless Function — recebe vendas de sistemas externos (ex.: a
// operação Eterniza reenvia cada pedido dos webhooks Yampi/Cakto dela) e faz
// upsert na tabela `sales`. Os triggers do banco (recompute_project_metrics)
// mantêm projects.faturamento/lucro e metric_snapshots em dia sozinhos.
//
// A UTMify não tem API de leitura — este endpoint é o "espelho": quem já
// processa a venda na origem manda uma cópia normalizada pra cá.
//
// Env vars (server-side):
//   ORDERS_SYNC_SECRET          — shared secret com quem envia (header x-sync-secret)
//   SUPABASE_URL                — https://<id>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   — service role key (bypassa RLS)
//
// Payload: { gateway, project_id, orders: [{ transaction_id, status, ... }] }
// Máx. 500 pedidos por chamada. Upsert por (gateway, transaction_id).

const crypto = require("crypto");

const STATUS_OK = new Set(["paid", "pending", "refunded", "chargeback", "refused", "canceled"]);
const MAX_ORDERS = 500;

function secretOk(provided, expected) {
  if (!provided || !expected) return false;
  const a = Buffer.from(String(provided));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

const s = (v, max = 500) => (v == null ? null : String(v).slice(0, max));
const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const ts = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const expected = process.env.ORDERS_SYNC_SECRET;
  if (!expected) {
    console.error("[orders-sync] ORDERS_SYNC_SECRET não configurada");
    return res.status(500).json({ error: "server_misconfigured" });
  }
  if (!secretOk(req.headers["x-sync-secret"], expected)) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("[orders-sync] Supabase env vars ausentes");
    return res.status(500).json({ error: "server_misconfigured" });
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body;
  const gateway = s(body?.gateway, 40);
  const projectId = s(body?.project_id, 60);
  const orders = Array.isArray(body?.orders) ? body.orders : null;

  if (!gateway || !projectId || !orders || !orders.length) {
    return res.status(400).json({ error: "bad_request", detail: "gateway, project_id e orders[] são obrigatórios" });
  }
  if (orders.length > MAX_ORDERS) {
    return res.status(400).json({ error: "too_many_orders", max: MAX_ORDERS });
  }
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) {
    return res.status(400).json({ error: "bad_project_id" });
  }

  const sb = (path, init = {}) =>
    fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });

  try {
    // projeto precisa existir (evita vendas órfãs por typo de id)
    const pr = await sb(`projects?id=eq.${projectId}&select=id`);
    const pdata = pr.ok ? await pr.json() : [];
    if (!pdata.length) return res.status(404).json({ error: "project_not_found" });

    const rows = [];
    const skipped = [];
    for (const o of orders) {
      const txId = s(o?.transaction_id, 120);
      const status = s(o?.status, 20);
      if (!txId || !STATUS_OK.has(status)) {
        skipped.push({ transaction_id: txId, reason: !txId ? "sem transaction_id" : "status inválido" });
        continue;
      }
      rows.push({
        project_id: projectId,
        gateway,
        transaction_id: txId,
        event: s(o.event, 60),
        status,
        product_name: s(o.product_name, 200),
        customer_name: s(o.customer_name, 200),
        customer_email: s(o.customer_email, 200),
        customer_phone: s(o.customer_phone, 40),
        amount: n(o.amount),
        base_amount: n(o.base_amount != null ? o.base_amount : o.amount),
        fees: n(o.fees),
        net_amount: n(o.net_amount),
        payment_method: s(o.payment_method, 40),
        utm_source: s(o.utm_source, 200),
        utm_medium: s(o.utm_medium, 200),
        utm_campaign: s(o.utm_campaign, 300),
        utm_content: s(o.utm_content, 300),
        utm_term: s(o.utm_term, 200),
        src: s(o.src, 200),
        paid_at: status === "paid" ? (ts(o.paid_at) || new Date().toISOString()) : ts(o.paid_at),
        ordered_at: ts(o.ordered_at),
      });
    }

    if (!rows.length) {
      return res.status(400).json({ error: "no_valid_orders", skipped });
    }

    const up = await sb("sales?on_conflict=gateway,transaction_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows),
    });

    if (!up.ok) {
      const detail = await up.text().catch(() => "");
      console.error("[orders-sync] upsert falhou:", up.status, detail.slice(0, 500));
      return res.status(502).json({ error: "supabase_upsert_failed" });
    }

    return res.status(200).json({ ok: true, upserted: rows.length, skipped: skipped.length ? skipped : undefined });
  } catch (err) {
    console.error("[orders-sync] erro:", err);
    return res.status(500).json({ error: "internal_error" });
  }
};

function safeParse(x) {
  try { return JSON.parse(x); } catch { return null; }
}
