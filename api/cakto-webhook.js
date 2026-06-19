// Vercel Serverless Function — recebe o webhook do Cakto, valida o secret
// e repassa o payload ao Supabase (RPC ingest_cakto_sale) usando a service role.
// Env vars (server-side, NUNCA com prefixo VITE_):
//   CAKTO_WEBHOOK_SECRET        — mesmo valor configurado no painel do Cakto
//   SUPABASE_URL                — https://<id>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   — service role key (bypassa RLS)

const crypto = require("crypto");

// Comparação de segredo em tempo constante (evita timing attack que vaza o segredo char a
// char). timingSafeEqual exige buffers do mesmo tamanho — daí a checagem de length antes.
function secretOk(provided, expected) {
  if (!provided || !expected) return false;
  const a = Buffer.from(String(provided));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  // Vercel já parseia JSON quando o content-type é application/json
  const body = typeof req.body === "string" ? safeParse(req.body) : req.body;

  const expectedSecret = process.env.CAKTO_WEBHOOK_SECRET;
  if (!expectedSecret) {
    console.error("[cakto-webhook] CAKTO_WEBHOOK_SECRET não configurada");
    return res.status(500).json({ error: "server_misconfigured" });
  }

  // valida o secret enviado no corpo do webhook (comparação em tempo constante)
  if (!body || !secretOk(body.secret, expectedSecret)) {
    return res.status(401).json({ error: "invalid_secret" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("[cakto-webhook] Supabase env vars ausentes");
    return res.status(500).json({ error: "server_misconfigured" });
  }

  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/ingest_cakto_sale`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p: body }),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      // Detalhe fica só no log do servidor — não vaza schema/constraints do Postgres ao cliente.
      console.error("[cakto-webhook] RPC falhou:", resp.status, data);
      return res.status(502).json({ error: "supabase_rpc_failed" });
    }

    return res.status(200).json({ ok: true, result: data });
  } catch (err) {
    console.error("[cakto-webhook] erro:", err);
    return res.status(500).json({ error: "internal_error" });
  }
};

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}
