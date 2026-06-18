// Vercel Serverless Function — POST /api/v1/clone (api/v1/clone.js mapeia nessa URL).
// Faz DUAS coisas em paralelo e devolve juntas (o frontend NovoProjeto.jsx já consome tudo):
//   1) Clona a página de vendas no Tynk Pages (cria projeto -> importa URL -> detalha).
//   2) Extrai os campos da oferta (oferta, público, preço, persona...) com IA via OpenRouter.
//
// A extração é best-effort (ver api/_lib/extract.js): se falhar, devolve a clonagem mesmo assim
// com os campos de oferta vazios — nunca bloqueia o clone.
//
// Env vars (server-side, NUNCA com prefixo VITE_):
//   TYNK_API_KEY                  — Bearer key da Tynk (prefixo ep_) — obrigatória p/ clonar
//   TYNK_API_BASE                 — opcional, default https://pages.tynk.ai
//   OPENROUTER_API_KEY            — opcional; sem ela, a extração é pulada (campos vazios)
//   OPENROUTER_MODEL              — opcional; default um modelo :free

const { extractOfferFromUrl } = require("../_lib/extract.js");

function httpErr(status, body) { const e = new Error(body.error || "erro"); e.status = status; e.body = body; return e; }
function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }

function fetchWithTimeout(url, opts = {}, ms = 12000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), Math.max(1000, ms));
  return fetch(url, { ...opts, signal: ac.signal }).finally(() => clearTimeout(t));
}

// Clona a página no Tynk. Lança httpErr(status, body) em falha (mapeado para a resposta).
//
// IMPORTANTE: o passo de IMPORT da Tynk é síncrono e pode levar >45s em páginas pesadas,
// estourando os 60s da função (504). Por isso há um ORÇAMENTO de tempo (DEADLINE ~50s): a
// importação é limitada e, se estourar, NÃO derruba o clone — o projeto já foi criado e tem
// domínio, então retornamos com `import.timedOut` e a UI avisa que a importação segue pendente.
async function cloneNoTynk(pageUrl, nome, KEY, TBASE) {
  const H = {
    "Content-Type": "application/json", Accept: "application/json",
    Authorization: `Bearer ${KEY}`, "User-Agent": "Mozilla/5.0",
  };
  const DEADLINE = Date.now() + 50000;            // retorna por ~50s (folga abaixo dos 60s)
  const left = (reserve = 0) => Math.max(1000, DEADLINE - Date.now() - reserve);

  // 1) cria o projeto no Tynk
  let cr;
  try {
    cr = await fetchWithTimeout(`${TBASE}/api/v1/projects`, { method: "POST", headers: H, body: JSON.stringify({ title: nome || "Oferta clonada" }) }, Math.min(12000, left(10000)));
  } catch (_) {
    throw httpErr(504, { error: "TYNK_CREATE_TIMEOUT", detail: "A Tynk demorou demais para criar o projeto. Tente de novo." });
  }
  const crd = await cr.json().catch(() => ({}));
  if (!cr.ok) throw httpErr(502, { error: "TYNK_CREATE_FAILED", detail: JSON.stringify(crd).slice(0, 300) });
  const projectId = crd.project?.id || crd.id || crd.projectId;
  if (!projectId) throw httpErr(502, { error: "TYNK_NO_PROJECT_ID", detail: JSON.stringify(crd).slice(0, 300) });

  // 2) importa a página da URL para o projeto (limitado; reserva ~9s p/ o detalhe).
  //    Em timeout/erro de rede, marca timedOut e segue — não derruba o clone (evita o 504).
  let imd = {}, importTimedOut = false;
  try {
    const im = await fetchWithTimeout(`${TBASE}/api/v1/projects/${projectId}/import`, { method: "POST", headers: H, body: JSON.stringify({ url: pageUrl, mode: "modern" }) }, left(9000));
    imd = await im.json().catch(() => ({}));
    if (!im.ok) throw httpErr(502, { error: "TYNK_IMPORT_FAILED", tynkProjectId: projectId, detail: JSON.stringify(imd).slice(0, 300) });
  } catch (e) {
    if (e && e.status) throw e;                   // erro HTTP real da Tynk (ex.: 401/422) → propaga
    importTimedOut = true;                         // timeout (AbortError) ou rede → trata como pendente
  }

  // 3) detalha o projeto recém-criado
  let detd = {};
  try {
    const det = await fetchWithTimeout(`${TBASE}/api/v1/projects/${projectId}`, { headers: H }, Math.min(8000, left()));
    detd = await det.json().catch(() => ({}));
  } catch (_) { /* segue com o que já temos do create */ }
  const proj = detd.project || crd.project || crd || {};
  const domain = proj.domain || crd.project?.domain || null;

  const tynk = {
    projectId, title: proj.title || nome || null, domain,
    createdAt: proj.createdAt || null, tags: proj.tags || null,
    marketplaceApprovalStatus: proj.marketplaceApprovalStatus || null,
    isPublished: proj.isPublished ?? null,
    import: {
      success: importTimedOut ? false : (imd.success ?? null),
      importId: imd.importId || null, basePath: imd.basePath || null,
      timedOut: importTimedOut,
    },
    sourceUrl: pageUrl, pageUrl: domain ? `${TBASE}/${domain}` : null, editUrl: `${TBASE}/${projectId}`,
    clonadoEm: new Date().toISOString(),
  };
  const links = [
    { tipo: "Página de vendas (original)", url: pageUrl },
    ...(tynk.pageUrl ? [{ tipo: "Página clonada (Tynk)", url: tynk.pageUrl }] : []),
  ];
  return { tynk, links };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const KEY = process.env.TYNK_API_KEY;
  const TBASE = process.env.TYNK_API_BASE || "https://pages.tynk.ai";
  if (!KEY) {
    return res.status(501).json({ error: "CLONE_NOT_CONFIGURED", detail: "Falta TYNK_API_KEY nas variáveis de ambiente do servidor." });
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body;
  const pageUrl = body?.url;
  const nome = body?.nome;
  if (!pageUrl) {
    return res.status(400).json({ error: "URL_REQUIRED", detail: "Informe a URL da página de vendas." });
  }

  // Clone (Tynk) e extração (IA) rodam em paralelo — são independentes.
  const [cloneRes, extractRes] = await Promise.allSettled([
    cloneNoTynk(pageUrl, nome, KEY, TBASE),
    extractOfferFromUrl(pageUrl),
  ]);

  // Clone é a ação central: se falhar, devolve o erro dele.
  if (cloneRes.status === "rejected") {
    const e = cloneRes.reason || {};
    return res.status(e.status || 502).json(e.body || { error: "CLONE_ERROR", detail: String(e.message || e) });
  }

  const { tynk, links } = cloneRes.value;
  const ex = extractRes.status === "fulfilled" && extractRes.value ? extractRes.value : {};

  // Indica se a extração funcionou: "ok" = campos preenchidos, "vazia" = IA não extraiu nada, "sem_ia" = key não configurada.
  const KEY_FIELDS = ["oferta", "publico", "preco", "nome"];
  const extracao = !process.env.OPENROUTER_API_KEY ? "sem_ia"
    : KEY_FIELDS.some((k) => ex[k]) ? "ok"
    : "vazia";

  // resposta normalizada para o frontend (contrato de frontend/src/lib/api/clone.js)
  return res.status(200).json({
    nome: ex.nome || tynk.title || nome || null,
    nicho: ex.nicho || "",
    oferta: ex.oferta || "",
    publico: ex.publico || "",
    idade: ex.idade || "",
    preco: ex.preco || "",
    garantia: ex.garantia || "",
    ...(ex.persona ? { persona: ex.persona } : {}),
    tynk,
    links,
    extracao,
  });
};
