// Dispara a sincronização da planilha do Adveronix para 1 projeto. O servidor lê a planilha,
// grava em metric_snapshots e devolve o status (linhas importadas / erro).
const API_BASE =
  import.meta.env.VITE_API_BASE ??
  (import.meta.env.DEV ? "http://localhost:4000" : "");

export async function sincronizarSheets({ projectId }) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/v1/sheets-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor de sincronização.");
  }
  if (!res.ok) {
    let detalhe = "";
    try { detalhe = (await res.json()).detail || ""; } catch { detalhe = ""; }
    throw new Error(detalhe || `Sincronização falhou (${res.status})`);
  }
  return res.json();
}
