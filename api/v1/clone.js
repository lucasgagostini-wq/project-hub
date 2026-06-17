// Vercel Serverless Function — clona uma página de vendas via Tynk Pages.
// Rota pública: POST /api/v1/clone  (o arquivo api/v1/clone.js mapeia nessa URL).
// O frontend (frontend/src/lib/api/clone.js) chama aqui com { url, nome }.
//
// Por que server-side: a key da Tynk não pode ficar no navegador e há CORS.
// Env vars (server-side, NUNCA com prefixo VITE_):
//   TYNK_API_KEY   — Bearer key da Tynk (prefixo ep_)
//   TYNK_API_BASE  — opcional, default https://pages.tynk.ai
//
// Fluxo (espelha server/cakto-bridge.mjs, rota /api/v1/clone):
//   1) cria projeto no Tynk -> 2) importa a URL -> 3) detalha -> devolve normalizado.

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const KEY = process.env.TYNK_API_KEY;
  const TBASE = process.env.TYNK_API_BASE || "https://pages.tynk.ai";
  if (!KEY) {
    return res.status(501).json({
      error: "CLONE_NOT_CONFIGURED",
      detail: "Falta TYNK_API_KEY nas variáveis de ambiente do servidor.",
    });
  }

  // Vercel já parseia JSON quando o content-type é application/json
  const body = typeof req.body === "string" ? safeParse(req.body) : req.body;
  const pageUrl = body?.url;
  const nome = body?.nome;
  if (!pageUrl) {
    return res.status(400).json({ error: "URL_REQUIRED", detail: "Informe a URL da página de vendas." });
  }

  const H = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${KEY}`,
    "User-Agent": "Mozilla/5.0",
  };

  try {
    // 1) cria o projeto no Tynk
    const cr = await fetch(`${TBASE}/api/v1/projects`, {
      method: "POST", headers: H,
      body: JSON.stringify({ title: nome || "Oferta clonada" }),
    });
    const crd = await cr.json().catch(() => ({}));
    if (!cr.ok) return res.status(502).json({ error: "TYNK_CREATE_FAILED", detail: JSON.stringify(crd).slice(0, 300) });
    const projectId = crd.project?.id || crd.id || crd.projectId;
    if (!projectId) return res.status(502).json({ error: "TYNK_NO_PROJECT_ID", detail: JSON.stringify(crd).slice(0, 300) });

    // 2) importa a página da URL para o projeto
    const im = await fetch(`${TBASE}/api/v1/projects/${projectId}/import`, {
      method: "POST", headers: H,
      body: JSON.stringify({ url: pageUrl, mode: "modern" }),
    });
    const imd = await im.json().catch(() => ({}));
    if (!im.ok) return res.status(502).json({ error: "TYNK_IMPORT_FAILED", tynkProjectId: projectId, detail: JSON.stringify(imd).slice(0, 300) });

    // 3) detalha o projeto recém-criado
    const det = await fetch(`${TBASE}/api/v1/projects/${projectId}`, { headers: H });
    const detd = await det.json().catch(() => ({}));
    const proj = detd.project || crd.project || crd || {};
    const domain = proj.domain || crd.project?.domain || null;

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
    return res.status(200).json({
      nome: tynk.title,
      tynk,
      links: [
        { tipo: "Página de vendas (original)", url: pageUrl },
        ...(tynk.pageUrl ? [{ tipo: "Página clonada (Tynk)", url: tynk.pageUrl }] : []),
      ],
    });
  } catch (e) {
    return res.status(502).json({ error: "CLONE_ERROR", detail: String(e.message || e) });
  }
};

function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }
