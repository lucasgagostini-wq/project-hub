// ─────────────────────────────────────────────────────────────────────────────
// Métricas das integrações do projeto.
//
// Faturamento (por projeto):
//   • PRODUÇÃO — fonte de verdade é o Supabase: o webhook da Cakto grava as vendas
//     (api/cakto-webhook -> ingest_cakto_sale) e o trigger recompute_project_metrics
//     mantém projects.faturamento já escopado por projeto (via gateway_products).
//     O app só lê projeto.faturamento — não há pull direto da Cakto.
//   • DEV — sem Supabase/webhook, a ponte local (server/cakto-bridge.mjs em :4000)
//     puxa a Cakto direto e filtra pelos produtos configurados na conexão do projeto,
//     simulando o mesmo escopo. Ativada por VITE_API_BASE (ou DEV apontando p/ :4000).
//
// Gasto de anúncios: o UTMfy não expõe API pública de leitura — entrada manual. null.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE =
  import.meta.env.VITE_API_BASE ??
  (import.meta.env.DEV ? "http://localhost:4000" : "");

// Aceita string "a, b, c" ou array; devolve lista limpa de identificadores de produto.
function normalizarProdutos(p) {
  if (Array.isArray(p)) return p.map((x) => String(x).trim()).filter(Boolean);
  if (typeof p === "string") return p.split(",").map((x) => x.trim()).filter(Boolean);
  return [];
}

/**
 * Sincroniza as métricas das integrações conectadas do projeto.
 * Retorna { faturamento, gastoAds, lucro, roas, conectado, fonte, escopo, sincronizadoEm }.
 * Campos vêm null quando a fonte correspondente não está integrada.
 */
export async function sincronizarMetricas(projeto) {
  const cakto = !!projeto.conexoes?.cakto?.conectado;
  const utmfy = !!projeto.conexoes?.utmfy?.conectado;
  const conectado = { cakto, utmfy };
  const base = {
    conectado,
    sincronizadoEm: new Date().toISOString(),
    fonte: { faturamento: cakto ? "cakto" : null, gastoAds: null },
  };

  let faturamento = null;
  let gastoAds = null;
  let escopo = null;

  if (cakto) {
    if (API_BASE) {
      // DEV: a ponte puxa a Cakto e soma só os pedidos dos produtos deste projeto.
      const produtos = normalizarProdutos(projeto.conexoes?.cakto?.produtos);
      const qs = produtos.length ? `?produtos=${encodeURIComponent(produtos.join(","))}` : "";
      const res = await fetch(`${API_BASE}/api/v1/projects/${projeto.id}/metrics${qs}`);
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Falha ao buscar faturamento da Cakto (${res.status}) ${txt.slice(0, 120)}`);
      }
      const data = await res.json();
      faturamento = data.faturamento ?? null;
      gastoAds = data.gastoAds ?? null; // hoje sempre null — Meta Ads ainda não integrado
      escopo = data.escopo ?? null;     // "produtos" | "sem-produtos"
    } else {
      // PRODUÇÃO: o faturamento por projeto já está no Supabase (webhook + gateway_products).
      faturamento = projeto.faturamento ?? null;
      escopo = "supabase";
    }
  }

  const lucro = faturamento != null && gastoAds != null ? faturamento - gastoAds : null;
  const roas = faturamento != null && gastoAds ? +(faturamento / gastoAds).toFixed(2) : null;

  return { ...base, faturamento, gastoAds, lucro, roas, escopo };
}
