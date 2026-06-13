import { env } from '../../../config/env';
import { MetricsProvider, NormalizedDailyMetric } from './types';

// Cliente UTMFy — traz métricas consolidadas de tracking.
export const utmfyProvider: MetricsProvider = {
  async fetchDailyMetrics(_params): Promise<NormalizedDailyMetric[]> {
    // TODO: GET ${env.integrations.utmfy.base}/... com Bearer env.integrations.utmfy.token
    //       Mapear a resposta para NormalizedDailyMetric[].
    void env;
    throw new Error('NOT_IMPLEMENTED: utmfyProvider.fetchDailyMetrics');
  },
};
