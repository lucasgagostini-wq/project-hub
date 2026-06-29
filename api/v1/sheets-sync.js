// Sincroniza o gasto de anúncios (planilha do Adveronix) -> metric_snapshots (source='meta').
// Modo projeto: POST { projectId } (botão "Sincronizar agora").
// Modo cron:    GET/POST sem projectId + segredo do cron -> todos os projetos conectados.
//   (O Vercel Cron dispara GET e injeta `Authorization: Bearer <CRON_SECRET>`.)
// Sem GOOGLE_SERVICE_ACCOUNT_JSON -> 501 SHEETS_NOT_CONFIGURED (estado gracioso).

const { fetchSheetValues, parseRows } = require("../_lib/sheets.js");

function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function sb(path, opts = {}) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json", Prefer: "return=representation",
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) { const e = new Error("SUPABASE_ERROR"); e.detail = JSON.stringify(data).slice(0, 200); throw e; }
  return data;
}

// Extrai o id de uma URL de planilha ou aceita o id puro.
function sheetIdFrom(s) {
  const m = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/.exec(String(s || ""));
  return m ? m[1] : String(s || "").trim();
}

async function syncProject(proj) {
  const cfg = (proj.conexoes && proj.conexoes.sheets) || null;
  if (!cfg || !cfg.enabled || !cfg.sheetId) return { projectId: proj.id, skipped: true };

  const status = { lastSyncAt: new Date().toISOString(), lastStatus: "ok", lastError: null, rowsImported: 0 };
  try {
    const values = await fetchSheetValues(sheetIdFrom(cfg.sheetId), cfg.tab || "Sheet1");
    const map = cfg.map || { date: "Date", spend: "Spend", impressions: "Impressions", clicks: "Clicks", conversions: "Conversions" };
    const { rows, skipped, error } = parseRows(values, map, cfg.headerRow || 1);
    if (error) throw Object.assign(new Error(error), { detail: error });

    if (rows.length) {
      // upsert por (project_id, date, source) — uma chamada com todas as linhas do dia.
      const payload = rows.map((r) => ({
        project_id: proj.id, date: r.date, source: "meta",
        ad_spend: r.ad_spend, impressions: r.impressions, clicks: r.clicks, conversions: r.conversions,
        revenue: 0, net_profit: 0,
      }));
      await sb("metric_snapshots?on_conflict=project_id,date,source", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(payload),
      });
    }
    status.rowsImported = rows.length;
    status.skipped = skipped;
  } catch (e) {
    status.lastStatus = "erro";
    status.lastError = (e.code || e.message || "erro") + (e.detail ? `: ${e.detail}` : "");
  }

  // grava o status de volta na conexão do projeto (config não-secreta)
  const novasConexoes = { ...(proj.conexoes || {}), sheets: { ...cfg, ...status } };
  await sb(`projects?id=eq.${proj.id}`, {
    method: "PATCH", headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ conexoes: novasConexoes }),
  });
  return { projectId: proj.id, ...status };
}

module.exports = async (req, res) => {
  // Vercel Cron dispara GET; o app dispara POST. Aceitamos os dois.
  if (req.method !== "POST" && req.method !== "GET") {
    res.setHeader("Allow", "POST, GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (!SB_URL || !SB_KEY) return res.status(501).json({ error: "STORAGE_NOT_CONFIGURED" });
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return res.status(501).json({ error: "SHEETS_NOT_CONFIGURED", detail: "Falta GOOGLE_SERVICE_ACCOUNT_JSON no servidor." });
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body;
  const projectId = body && body.projectId;

  // Modo cron: sincroniza todos os projetos conectados (exige o segredo do cron).
  if (!projectId) {
    const secret = req.headers["x-cron-secret"];
    const authOk = req.headers["authorization"] === `Bearer ${process.env.CRON_SECRET}`;
    if (!process.env.CRON_SECRET || (secret !== process.env.CRON_SECRET && !authOk)) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const projetos = await sb("projects?select=id,conexoes&active=eq.true");
    const alvo = (projetos || []).filter((p) => p.conexoes && p.conexoes.sheets && p.conexoes.sheets.enabled);
    const results = await Promise.allSettled(alvo.map((p) => syncProject(p)));
    return res.status(200).json({
      ok: true, total: alvo.length,
      results: results.map((r) => (r.status === "fulfilled" ? r.value : { error: String(r.reason) })),
    });
  }

  // Modo projeto (botão manual).
  const rows = await sb(`projects?id=eq.${projectId}&select=id,conexoes`);
  const proj = rows && rows[0];
  if (!proj) return res.status(404).json({ error: "project_not_found" });
  const out = await syncProject(proj);
  if (out.lastStatus === "erro") return res.status(502).json({ error: "SYNC_FAILED", detail: out.lastError, ...out });
  return res.status(200).json({ ok: true, ...out });
};
