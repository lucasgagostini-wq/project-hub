import { env } from '../../../config/env';
import { MetricsProvider, NormalizedDailyMetric } from './types';

// Cliente Cakto — vendas/faturamento do checkout.
export const caktoProvider: MetricsProvider = {
  async fetchDailyMetrics(_params): Promise<NormalizedDailyMetric[]> {
    // TODO: GET ${env.integrations.cakto.base}/... com token; agregar vendas por dia.
    void env;
    throw new Error('NOT_IMPLEMENTED: caktoProvider.fetchDailyMetrics');
  },
};
