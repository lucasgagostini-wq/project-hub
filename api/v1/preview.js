// Vercel Serverless Function — GET /api/v1/preview?id=<id>
// Serve o snapshot guardado no Supabase Storage FORÇANDO Content-Type text/html, para o
// navegador RENDERIZAR a página (o Storage serve text/plain e mostraria o código-fonte).
// O bucket é público, então a leitura não precisa de chave.
//
// Limite de resposta da função (~4.5MB): snapshots são capados p/ caber (ver api/_lib/snapshot.js).
// Se mesmo assim passar do limite, redireciona pra URL crua do Storage (degrada, mas funciona).

const MAX_INLINE = 4 * 1024 * 1024; // acima disso, redireciona em vez de servir inline

module.exports = async (req, res) => {
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
    return res.end(html);
  } catch (e) {
    res.statusCode = 502;
    return res.end("Erro ao carregar o snapshot.");
  }
};
