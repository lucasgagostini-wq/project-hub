// ─────────────────────────────────────────────────────────────────────────────
// Ponte LOCAL de desenvolvimento (não vai pra produção).
// Resolve a limitação de o frontend não poder chamar a Cakto direto
// (CORS + o secret não pode ficar no navegador).
//
// Guarda as credenciais só em memória (passadas por variável de ambiente),
// troca por um token OAuth2, agrega os pedidos pagos e expõe o faturamento
// no MESMO contrato que o backend de produção deve implementar:
//
//     GET /api/v1/projects/:id/metrics  ->  { faturamento, gastoAds, ... }
//
// Rodar (TLS do Windows via --use-system-ca por causa do proxy/antivírus):
//   CAKTO_CLIENT_ID=... CAKTO_CLIENT_SECRET=... \
//   NODE_OPTIONS=--use-system-ca node server/cakto-bridge.mjs
// ─────────────────────────────────────────────────────────────────────────────
import http from "node:http";

const PORT = Number(process.env.BRIDGE_PORT || 4000);
const BASE = process.env.CAKTO_API_BASE || "https://api.cakto.com.br";
const CLIENT_ID = process.env.CAKTO_CLIENT_ID;
const CLIENT_SECRET = process.env.CAKTO_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("[bridge] Faltam CAKTO_CLIENT_ID / CAKTO_CLIENT_SECRET no ambiente.");
  process.exit(1);
}

// ── Token OAuth2 com cache em memória ────────────────────────────────────────
let tokenCache = { value: null, exp: 0 };
async function getToken() {
  const now = Date.now();
  if (tokenCache.value && now < tokenCache.exp) return tokenCache.value;
  const r = await fetch(`${BASE}/public_api/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });
  if (!r.ok) throw new Error(`token ${r.status}: ${await r.text()}`);
  const d = await r.json();
  // renova 60s antes de expirar
  tokenCache = { value: d.access_token, exp: now + (Number(d.expires_in || 3600) - 60) * 1000 };
  return tokenCache.value;
}

// ── Agrega faturamento dos pedidos pagos ─────────────────────────────────────
async function getFaturamentoCakto() {
  const token = await getToken();
  let page = 1, total = 0;
  const porStatus = {};
  let bruto = 0, pagos = 0;

  while (page <= 100) {
    const r = await fetch(`${BASE}/public_api/orders/?limit=100&page=${page}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) throw new Error(`orders ${r.status}: ${await r.text()}`);
    const d = await r.json();
    total = d.count ?? total;
    const rows = d.results || [];
    for (const o of rows) {
      porStatus[o.status] = (porStatus[o.status] || 0) + 1;
      if (o.status === "paid") { pagos++; bruto += Number(o.amount || 0); }
    }
    if (!d.next || rows.length === 0) break;
    page++;
  }
  return { faturamento: Math.round(bruto * 100) / 100, pedidosPagos: pagos, pedidosTotal: total, porStatus };
}

// ── HTTP ─────────────────────────────────────────────────────────────────────
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
function json(res, code, body) {
  cors(res);
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") { cors(res); res.writeHead(204); return res.end(); }
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/health") return json(res, 200, { ok: true, provider: "cakto" });

  // POST /api/v1/clone  — clona uma página de vendas via Tynk Pages
  // Fluxo: cria projeto no Tynk -> importa a URL -> devolve dados normalizados.
  if (url.pathname === "/api/v1/clone" && req.method === "POST") {
    const KEY = process.env.TYNK_API_KEY;
    const TBASE = process.env.TYNK_API_BASE || "https://pages.tynk.ai";
    if (!KEY) {
      return json(res, 501, { error: "CLONE_NOT_CONFIGURED", detail: "Falta TYNK_API_KEY na ponte." });
    }
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", async () => {
      try {
        const { url: pageUrl, nome } = JSON.parse(body || "{}");
        if (!pageUrl) return json(res, 400, { error: "URL_REQUIRED", detail: "Informe a URL da página de vendas." });
        const H = {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${KEY}`,
          "User-Agent": "Mozilla/5.0",
        };

        // 1) cria o projeto no Tynk
        const cr = await fetch(`${TBASE}/api/v1/projects`, {
          method: "POST", headers: H,
          body: JSON.stringify({ title: nome || "Oferta clonada" }),
        });
        const crd = await cr.json().catch(() => ({}));
        if (!cr.ok) return json(res, 502, { error: "TYNK_CREATE_FAILED", detail: JSON.stringify(crd).slice(0, 300) });
        const projectId = crd.project?.id || crd.id || crd.projectId;
        if (!projectId) return json(res, 502, { error: "TYNK_NO_PROJECT_ID", detail: JSON.stringify(crd).slice(0, 300) });

        // 2) importa a página da URL para o projeto
        const im = await fetch(`${TBASE}/api/v1/projects/${projectId}/import`, {
          method: "POST", headers: H,
          body: JSON.stringify({ url: pageUrl, mode: "modern" }),
        });
        const imd = await im.json().catch(() => ({}));
        if (!im.ok) return json(res, 502, { error: "TYNK_IMPORT_FAILED", tynkProjectId: projectId, detail: JSON.stringify(imd).slice(0, 300) });

        // 3) detalha o projeto recém-criado (metadata completa)
        const det = await fetch(`${TBASE}/api/v1/projects/${projectId}`, { headers: H });
        const detd = await det.json().catch(() => ({}));
        const proj = detd.project || crd.project || crd || {};
        const domain = proj.domain || crd.project?.domain || null;

        // bloco com TUDO que a API retorna de útil (sem o assetMapping gigante)
        const tynk = {
          projectId,
          title: proj.title || nome || null,
          domain,
          createdAt: proj.createdAt || null,
          tags: proj.tags || null,
          marketplaceApprovalStatus: proj.marketplaceApprovalStatus || null,
          isPublished: proj.isPublished ?? null,
          import: { success: imd.success ?? null, importId: imd.importId || null, basePath: imd.basePath || null },
          sourceUrl: pageUrl,
          pageUrl: domain ? `${TBASE}/${domain}` : null,   // provável URL pública
          editUrl: `${TBASE}/${projectId}`,                 // editor no Tynk
          clonadoEm: new Date().toISOString(),
        };

        // resposta normalizada para o frontend (contrato de clone.js)
        return json(res, 200, {
          nome: tynk.title,
          tynk,
          links: [
            { tipo: "Página de vendas (original)", url: pageUrl },
            ...(tynk.pageUrl ? [{ tipo: "Página clonada (Tynk)", url: tynk.pageUrl }] : []),
          ],
        });
      } catch (e) {
        return json(res, 502, { error: "CLONE_ERROR", detail: String(e.message || e) });
      }
    });
    return;
  }

  // GET /api/v1/projects/:id/metrics
  const m = url.pathname.match(/^\/api\/v1\/projects\/([^/]+)\/metrics\/?$/);
  if (m && req.method === "GET") {
    try {
      const cakto = await getFaturamentoCakto();
      return json(res, 200, {
        projectId: m[1],
        faturamento: cakto.faturamento,   // real, da Cakto
        gastoAds: null,                   // ainda não integrado (vem do Meta/Google Ads)
        fonte: { faturamento: "cakto", gastoAds: null },
        cakto,
        sincronizadoEm: new Date().toISOString(),
      });
    } catch (e) {
      return json(res, 502, { error: "CAKTO_FETCH_FAILED", detail: String(e.message || e) });
    }
  }

  json(res, 404, { error: "NOT_FOUND" });
});

server.listen(PORT, () => console.log(`[bridge] Cakto bridge on http://localhost:${PORT}`));
