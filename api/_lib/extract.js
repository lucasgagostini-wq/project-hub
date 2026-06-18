// Extração dos campos de uma oferta a partir do conteúdo de uma página de vendas, via LLM (OpenRouter).
// CommonJS (sem package.json na raiz → .js é CJS). Usado por api/v1/clone.js (prod) e pela ponte de dev.
// O prefixo "_" em api/_lib/ faz o Vercel NÃO tratar este arquivo como rota — é só um módulo auxiliar.
//
// Filosofia: best-effort e NUNCA lança. Qualquer falha (sem key, fetch, 429, timeout, JSON inválido)
// devolve {} (ou objeto parcial), e quem chama segue sem os campos — a clonagem nunca quebra por isso.

const NICHOS = [
  "Saúde e Bem-Estar", "Finanças", "Negócios", "Beleza",
  "Relacionamentos", "Educação", "Tecnologia", "Entretenimento",
];
const MAX_CHARS = 8000; // teto de texto enviado ao modelo (limita tokens/custo/latência)

function fetchWithTimeout(url, opts = {}, ms = 12000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  return fetch(url, { ...opts, signal: ac.signal }).finally(() => clearTimeout(t));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1) Conteúdo da página: Jina Reader (renderiza JS, devolve markdown limpo) com fallback p/ HTML cru.
async function fetchPageText(pageUrl) {
  try {
    const r = await fetchWithTimeout(`https://r.jina.ai/${pageUrl}`, {
      headers: { Accept: "text/plain", "User-Agent": "Mozilla/5.0", "X-Return-Format": "markdown" },
    }, 10000);
    if (r.ok) {
      const txt = (await r.text()).trim();
      if (txt.length > 200) return txt.slice(0, MAX_CHARS);
    }
  } catch (_) { /* cai no fallback */ }

  try {
    const r = await fetchWithTimeout(pageUrl, { headers: { "User-Agent": "Mozilla/5.0" } }, 6000);
    if (!r.ok) return "";
    const html = await r.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_CHARS);
  } catch (_) {
    return "";
  }
}

// JSON robusto: parse direto; se falhar, extrai o primeiro {...} (tolera cercas ``` e texto ao redor).
function parseJsonLoose(s) {
  if (!s) return null;
  try { return JSON.parse(s); } catch (_) {}
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(s.slice(start, end + 1)); } catch (_) {}
  }
  return null;
}

// 2) OpenRouter — chat completion num modelo específico, com 1 retry curto em 429.
async function callModel(model, text) {
  const KEY = process.env.OPENROUTER_API_KEY;
  if (!KEY) return null;

  const sys = `Você extrai dados de páginas de vendas para um cockpit de gestão de ofertas.
Responda APENAS um JSON válido (sem markdown, sem texto fora do JSON) com as chaves exatas:
nome, nicho, oferta, publico, idade, preco, garantia, persona.
"persona" é um objeto com: nome, dor, desejo, objecao, canal.
Regras: campo desconhecido = string vazia "". "oferta" = descrição curta do que é o produto e o que resolve.
"publico" = para quem é. "idade" = faixa etária (ex: "30-55"). "preco" = preço/ticket como texto
(ex: "R$ 197" ou "12x de R$ 19,90"). "garantia" = ex: "30 dias". "persona.nome" = um nome representativo
do público (ex: "Juliana, 38 anos"). "nicho" deve ser EXATAMENTE um destes: ${NICHOS.join(", ")}.`;

  const body = {
    model,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: "Conteúdo da página de vendas:\n\n" + text },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 700,
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    let r;
    try {
      r = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://project-hub-fmidia.vercel.app",
          "X-Title": "Project Hub",
        },
        body: JSON.stringify(body),
      }, 28000); // modelos :free podem demorar ~20s+
    } catch (_) {
      return null; // timeout/abort
    }
    if (r.status === 429 && attempt === 0) { await sleep(2500); continue; } // 1 retry curto só em 429
    if (!r.ok) return null;
    const d = await r.json().catch(() => null);
    return d?.choices?.[0]?.message?.content || null;
  }
  return null;
}

// Normaliza a saída do modelo para o shape esperado pelo frontend (NovoProjeto.jsx).
function normalize(obj) {
  if (!obj || typeof obj !== "object") return {};
  const s = (v) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v));
  const p = obj.persona && typeof obj.persona === "object" ? obj.persona : {};
  return {
    nome: s(obj.nome),
    nicho: NICHOS.includes(s(obj.nicho)) ? s(obj.nicho) : "",
    oferta: s(obj.oferta),
    publico: s(obj.publico),
    idade: s(obj.idade),
    preco: s(obj.preco),
    garantia: s(obj.garantia),
    persona: {
      nome: s(p.nome), dor: s(p.dor), desejo: s(p.desejo),
      objecao: s(p.objecao), canal: s(p.canal),
    },
  };
}

// Orquestra: URL → texto → LLM → campos normalizados. Best-effort, nunca lança.
// Teto global de 40s: se estourar (ex: free tier lento), resolve {} e a clonagem segue sem os campos.
async function extractOfferFromUrl(pageUrl) {
  if (!process.env.OPENROUTER_API_KEY) return {};
  const work = (async () => {
    const text = await fetchPageText(pageUrl);
    if (!text || text.length < 50) return {};
    // Primário (melhor qualidade) com fallback (mais confiável). Ambos modelos rápidos :free.
    const primary = process.env.OPENROUTER_MODEL || "openai/gpt-oss-120b:free";
    const fallback = process.env.OPENROUTER_MODEL_FALLBACK || "nvidia/nemotron-nano-12b-v2-vl:free";
    let parsed = parseJsonLoose(await callModel(primary, text));
    if (!parsed && fallback && fallback !== primary) {
      parsed = parseJsonLoose(await callModel(fallback, text));
    }
    return normalize(parsed);
  })().catch(() => ({}));
  const guard = new Promise((resolve) => setTimeout(() => resolve({}), 48000));
  return Promise.race([work, guard]);
}

module.exports = { extractOfferFromUrl };
