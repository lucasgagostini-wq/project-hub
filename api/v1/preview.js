// Vercel Serverless Function — GET /api/v1/preview?id=<id>
// Serve o snapshot guardado no Supabase Storage FORÇANDO Content-Type text/html, para o
// navegador RENDERIZAR a página (o Storage serve text/plain e mostraria o código-fonte).
// O bucket é público, então a leitura não precisa de chave.
//
// Limite de resposta da função (~4.5MB): snapshots são capados p/ caber (ver api/_lib/snapshot.js).
// Se mesmo assim passar do limite, redireciona pra URL crua do Storage (degrada, mas funciona).

const MAX_INLINE = 4 * 1024 * 1024; // acima disso, redireciona em vez de servir inline

module.exports = async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET, HEAD");
    return res.end("method_not_allowed");
  }
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const id = String((req.query && req.query.id) || "").replace(/[^a-zA-Z0-9_-]/g, "");
  if (!SUPABASE_URL || !id) {
    res.statusCode = 400;
    return res.end("Parâmetro 'id' obrigatório.");
  }

  const storageUrl = `${SUPABASE_URL}/storage/v1/object/public/snapshots/${id}.html`;
  try {
    const r = await fetch(storageUrl);
    if (!r.ok) {
      res.statusCode = 404;
      return res.end("Snapshot não encontrado.");
    }
    const html = await r.text();
    if (Buffer.byteLength(html) > MAX_INLINE) {
      res.statusCode = 302;
      res.setHeader("Location", storageUrl);
      return res.end();
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    // SEGURANÇA: o snapshot é HTML de terceiros servido no NOSSO domínio. `sandbox` faz o
    // navegador tratá-lo como origem opaca e bloqueia TODO script (inclusive handlers inline
    // como onerror= e URLs javascript:), neutralizando XSS armazenado sem afetar o CSS/imagens
    // estáticos. nosniff impede MIME sniffing; no-referrer evita vazar a URL de origem.
    res.setHeader("Content-Security-Policy", "sandbox");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    return res.end(html);
  } catch (e) {
    res.statusCode = 502;
    return res.end("Erro ao carregar o snapshot.");
  }
};
