// Vercel Serverless Function — POST /api/v1/snapshot
// Captura um snapshot fiel e (quase) auto-contido de uma página e hospeda no Supabase Storage
// (bucket público), devolvendo URL de preview (sem login Tynk) e URL de download.
//
// Body: { url, projectId? }
// Env (server-side): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (já existem na Vercel).

const { captureSnapshot } = require("../_lib/snapshot.js");

function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }

// Cria o bucket público se ainda não existir (idempotente — ignora "já existe").
async function ensureBucket(base, key, bucket) {
  try {
    await fetch(`${base}/storage/v1/bucket`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ id: bucket, name: bucket, public: true, file_size_limit: 52428800 }),
    });
  } catch (_) { /* se já existe, segue */ }
}

async function uploadHtml(base, key, bucket, path, html) {
  // Upload multipart (igual ao SDK): o content-type do arquivo vai na PARTE, e é assim
  // que o Storage define o mimetype do objeto. Upload raw não respeitava o header.
  const boundary = "----phsnap" + Math.random().toString(36).slice(2);
  const pre = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${path}"\r\nContent-Type: text/html\r\n\r\n`;
  const post = `\r\n--${boundary}--\r\n`;
  const body = Buffer.concat([Buffer.from(pre, "utf-8"), Buffer.from(html, "utf-8"), Buffer.from(post, "utf-8")]);
  const r = await fetch(`${base}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`, apikey: key,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Cache-Control": "max-age=3600",
      "x-upsert": "true", // sobrescreve se re-gerar
    },
    body,
  });
  if (!r.ok) return { ok: false, detail: (await r.text().catch(() => "")).slice(0, 200) };
  return { ok: true };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !KEY) {
    return res.status(501).json({ error: "STORAGE_NOT_CONFIGURED", detail: "Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY." });
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body;
  const url = body?.url;
  const projectId = body?.projectId;
  if (!url) return res.status(400).json({ error: "URL_REQUIRED", detail: "Informe a URL da página." });

  // 1) captura o snapshot
  const snap = await captureSnapshot(url);
  if (!snap.ok) return res.status(502).json({ error: "SNAPSHOT_FAILED", detail: snap.error });

  // 2) hospeda no Storage
  const bucket = "snapshots";
  await ensureBucket(SUPABASE_URL, KEY, bucket);
  const safeId = String(projectId || `snap-${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, "");
  const path = `${safeId}.html`;
  const up = await uploadHtml(SUPABASE_URL, KEY, bucket, path, snap.html);
  if (!up.ok) return res.status(502).json({ error: "UPLOAD_FAILED", detail: up.detail });

  // 3) devolve as URLs
  // preview via nosso proxy (força text/html p/ RENDERIZAR); download direto do Storage.
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  return res.status(200).json({
    ok: true,
    previewUrl: `/api/v1/preview?id=${safeId}`,
    downloadUrl: `${publicUrl}?download=oferta-${safeId}.html`,
    storageUrl: publicUrl,
    meta: snap.meta,
  });
};
