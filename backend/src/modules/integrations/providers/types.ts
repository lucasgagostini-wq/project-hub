// Formato normalizado que todo provider deve devolver para virar MetricSnapshot.
export interface NormalizedDailyMetric {
  date: string;       // YYYY-MM-DD
  revenue: number;    // faturamento do dia
  netProfit: number;  // lucro líquido (pode vir 0 se o provider não calcula)
  adSpend: number;    // gasto com anúncios
}

export interface MetricsProvider {
  /** Busca métricas diárias no intervalo. */
  fetchDailyMetrics(params: {
    accountId: string;
    from: string;
    to: string;
  }): Promise<NormalizedDailyMetric[]>;
}
