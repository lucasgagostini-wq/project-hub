// Captura um "snapshot" fiel e (quase) auto-contido de uma página de vendas.
// CommonJS, sem dependências externas (as funções serverless da Vercel rodam sem node_modules
// próprio aqui). Processamento via regex sobre o HTML JÁ RENDERIZADO que o Jina Reader devolve.
//
// Estratégia (equilíbrio entre fidelidade e tamanho de arquivo):
//   1) HTML renderizado (pós-JS) via Jina Reader; fallback p/ fetch direto.
//   2) Inline de TODO o CSS (<link rel=stylesheet> -> <style>), com url() resolvidas p/ absoluto.
//   3) Inline das imagens até um TETO (data URI base64); além do teto, vira URL absoluta.
//   4) <base href="origem"> como rede de segurança p/ qualquer asset relativo restante.
//   5) Remove <script> (preview estático; o DOM já veio renderizado).
//
// Best-effort: nunca lança; em falha grave devolve { ok:false }.

const ASSET_BUDGET_BYTES = 6 * 1024 * 1024; // teto total de imagens inline (~6MB)
const MAX_IMAGES = 60;                       // teto de quantidade de imagens inline
const HTML_TIMEOUT = 30000;
const ASSET_TIMEOUT = 8000;

function fetchWithTimeout(url, opts = {}, ms = ASSET_TIMEOUT) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  return fetch(url, { ...opts, signal: ac.signal }).finally(() => clearTimeout(t));
}

function resolveUrl(base, ref) {
  try { return new URL(ref, base).href; } catch { return null; }
}

// 1) HTML renderizado (pós-JS) via Jina; fallback p/ HTML cru.
async function fetchRenderedHtml(pageUrl) {
  try {
    const r = await fetchWithTimeout(`https://r.jina.ai/${pageUrl}`, {
      headers: { "X-Return-Format": "html", "User-Agent": "Mozilla/5.0" },
    }, HTML_TIMEOUT);
    if (r.ok) {
      const html = await r.text();
      if (html && html.length > 500) return html;
    }
  } catch (_) {}
  try {
    const r = await fetchWithTimeout(pageUrl, { headers: { "User-Agent": "Mozilla/5.0" } }, HTML_TIMEOUT);
    if (r.ok) return await r.text();
  } catch (_) {}
  return null;
}

// 2) Inline de uma folha de estilo, reescrevendo url(...) internas p/ absoluto.
async function fetchCssInlined(cssUrl) {
  try {
    const r = await fetchWithTimeout(cssUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) return null;
    let css = await r.text();
    // url(rel) -> url(abs) (resolve relativo ao próprio arquivo CSS)
    css = css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (m, q, ref) => {
      if (/^(data:|https?:|#)/i.test(ref)) return m;
      const abs = resolveUrl(cssUrl, ref);
      return abs ? `url(${q}${abs}${q})` : m;
    });
    return css;
  } catch (_) { return null; }
}

async function inlineStylesheets(html, baseUrl) {
  const linkRe = /<link\b[^>]*>/gi;
  const links = html.match(linkRe) || [];
  for (const tag of links) {
    if (!/rel\s*=\s*['"]?stylesheet/i.test(tag)) continue;
    const hrefM = tag.match(/href\s*=\s*['"]([^'"]+)['"]/i);
    if (!hrefM) continue;
    const abs = resolveUrl(baseUrl, hrefM[1]);
    if (!abs) continue;
    const css = await fetchCssInlined(abs);
    if (css != null) html = html.replace(tag, `<style data-inlined-from="${abs}">\n${css}\n</style>`);
  }
  return html;
}

// 3) Inline das imagens até o teto; além disso, deixa em URL absoluta.
async function inlineImages(html, baseUrl) {
  const imgRe = /<img\b[^>]*>/gi;
  const tags = html.match(imgRe) || [];
  let used = 0, count = 0;
  for (const tag of tags) {
    const srcM = tag.match(/\bsrc\s*=\s*['"]([^'"]+)['"]/i);
    if (!srcM) continue;
    const ref = srcM[1];
    if (/^data:/i.test(ref)) continue;
    const abs = resolveUrl(baseUrl, ref);
    if (!abs) continue;
    // remove srcset (evita o browser preferir uma URL relativa quebrada)
    let newTag = tag.replace(/\ssrcset\s*=\s*['"][^'"]*['"]/i, "");
    if (count < MAX_IMAGES && used < ASSET_BUDGET_BYTES) {
      try {
        const r = await fetchWithTimeout(abs, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (r.ok) {
          const buf = Buffer.from(await r.arrayBuffer());
          if (used + buf.length <= ASSET_BUDGET_BYTES) {
            const ct = r.headers.get("content-type") || "image/jpeg";
            const dataUri = `data:${ct};base64,${buf.toString("base64")}`;
            newTag = newTag.replace(srcM[0], `src="${dataUri}"`);
            used += buf.length; count++;
            html = html.replace(tag, newTag);
            continue;
          }
        }
      } catch (_) {}
    }
    // não inlinado: garante src absoluto
    newTag = newTag.replace(srcM[0], `src="${abs}"`);
    html = html.replace(tag, newTag);
  }
  return { html, inlined: count, bytes: used };
}

function stripScripts(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<script\b[^>]*\/>/gi, "");
}

function injectBase(html, baseUrl) {
  const baseTag = `<base href="${baseUrl}">`;
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head([^>]*)>/i, `<head$1>\n${baseTag}`);
  return baseTag + html;
}

// Orquestra a captura. Devolve { ok, html, meta } — nunca lança.
async function captureSnapshot(pageUrl) {
  try {
    let html = await fetchRenderedHtml(pageUrl);
    if (!html) return { ok: false, error: "FETCH_FAILED" };
    html = injectBase(html, pageUrl);
    html = await inlineStylesheets(html, pageUrl);
    const imgRes = await inlineImages(html, pageUrl);
    html = stripScripts(imgRes.html);
    // marca d'água discreta de origem no topo do <body> (comentário)
    html = html.replace(/<body([^>]*)>/i, `<body$1>\n<!-- snapshot Project Hub de ${pageUrl} -->`);
    return { ok: true, html, meta: { sourceUrl: pageUrl, imagesInlined: imgRes.inlined, inlineBytes: imgRes.bytes, sizeBytes: Buffer.byteLength(html) } };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

module.exports = { captureSnapshot };
