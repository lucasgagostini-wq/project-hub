// ─────────────────────────────────────────────────────────────────────────────
// Clonagem de oferta a partir da URL da página de vendas.
// O frontend NÃO chama a API de clonagem direto (CORS + a key não pode ficar no
// navegador). Chama a ponte/backend, que guarda a key e fala com o provedor.
//
// Contrato esperado da resposta (o que a ponte deve devolver, já normalizado):
//   {
//     nome?, nicho?, oferta, publico?, idade?, preco?, garantia?,
//     persona?: { nome, dor, desejo, objecao, canal },
//     links?: [{ tipo, url }]
//   }
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE =
  import.meta.env.VITE_API_BASE ??
  (import.meta.env.DEV ? "http://localhost:4000" : "");

export async function clonarOferta({ url, nome }) {
  const res = await fetch(`${API_BASE}/api/v1/clone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, nome }),
  });
  if (!res.ok) {
    let detalhe = "";
    try { detalhe = (await res.json()).detail || ""; } catch { detalhe = await res.text().catch(() => ""); }
    throw new Error(detalhe || `Clonagem falhou (${res.status})`);
  }
  return res.json();
}

// Gera um snapshot fiel da página (CSS/imagens inline) e hospeda no Storage.
// Retorna { previewUrl, downloadUrl, meta } — preview abre sem login no Tynk.
export async function gerarSnapshot({ url, projectId }) {
  const res = await fetch(`${API_BASE}/api/v1/snapshot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, projectId }),
  });
  if (!res.ok) {
    let detalhe = "";
    try { detalhe = (await res.json()).detail || ""; } catch { detalhe = await res.text().catch(() => ""); }
    throw new Error(detalhe || `Snapshot falhou (${res.status})`);
  }
  return res.json();
}
