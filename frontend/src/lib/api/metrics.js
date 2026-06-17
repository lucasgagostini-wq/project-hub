// ─────────────────────────────────────────────────────────────────────────────
// Métricas das integrações do projeto.
//   • Faturamento  → Cakto (real), via backend/ponte: GET /api/v1/projects/:id/metrics
//   • Gasto anúncios → ainda SEM fonte integrada (vem do Meta/Google Ads). Retorna null.
//
// Em dev, aponta para a ponte local (server/cakto-bridge.mjs) em :4000.
// Em produção, usa a mesma origem (o backend implementa o mesmo contrato).
// Configurável por VITE_API_BASE.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE =
  import.meta.env.VITE_API_BASE ??
  (import.meta.env.DEV ? "http://localhost:4000" : "");

/**
 * Sincroniza as métricas das integrações conectadas do projeto.
 * Retorna { faturamento, gastoAds, lucro, roas, conectado, fonte, sincronizadoEm }.
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

  if (cakto && API_BASE) {
    const res = await fetch(`${API_BASE}/api/v1/projects/${projeto.id}/metrics`);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Falha ao buscar faturamento da Cakto (${res.status}) ${txt.slice(0, 120)}`);
    }
    const data = await res.json();
    faturamento = data.faturamento ?? null;
    gastoAds = data.gastoAds ?? null; // hoje sempre null — Meta Ads ainda não integrado
  }

  const lucro = faturamento != null && gastoAds != null ? faturamento - gastoAds : null;
  const roas = faturamento != null && gastoAds ? +(faturamento / gastoAds).toFixed(2) : null;

  return { ...base, faturamento, gastoAds, lucro, roas };
}
