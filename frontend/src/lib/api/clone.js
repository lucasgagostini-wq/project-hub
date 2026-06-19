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

// POST JSON com tratamento de erro consistente. Distingue 3 casos:
//   • falha de rede (fetch rejeita: servidor fora, sem internet, CORS) → mensagem clara;
//   • resposta não-ok → usa o `detail` do corpo (ou o status);
//   • sucesso → devolve o JSON.
// Antes, cada função repetia esse bloco e a falha de rede vazava um "TypeError: Failed
// to fetch" cru para a UI.
async function postJson(endpoint, body, rotulo) {
  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor. Verifique sua conexão e tente de novo.");
  }
  if (!res.ok) {
    let detalhe = "";
    try { detalhe = (await res.json()).detail || ""; } catch { detalhe = await res.text().catch(() => ""); }
    throw new Error(detalhe || `${rotulo} falhou (${res.status})`);
  }
  return res.json();
}

export async function clonarOferta({ url, nome }) {
  return postJson(`${API_BASE}/api/v1/clone`, { url, nome }, "Clonagem");
}

// Gera um snapshot fiel da página (CSS/imagens inline) e hospeda no Storage.
// Retorna { previewUrl, downloadUrl, meta } — preview abre sem login no Tynk.
export async function gerarSnapshot({ url, projectId }) {
  return postJson(`${API_BASE}/api/v1/snapshot`, { url, projectId }, "Snapshot");
}
