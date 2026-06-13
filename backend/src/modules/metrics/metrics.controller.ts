import { Request, Response } from 'express';

/** GET /projects/:id/metrics?from=&to=&source= -> MetricSnapshot[]
 *  Alimenta a linha do tempo (faturamento/dia, delta ganho-ou-perdido). */
export async function timeline(_req: Request, res: Response) {
  // TODO: prisma.metricSnapshot.findMany por intervalo; calcular delta diário no serviço
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'metrics.timeline' });
}

/** POST /projects/:id/metrics  Body: { date, revenue, netProfit, adSpend, source? }
 *  Lançamento manual OU ponto de entrada da sincronização das integrações. */
export async function upsertSnapshot(_req: Request, res: Response) {
  // TODO: upsert por (projectId,date,source); writeAudit(CREATE/UPDATE,'MetricSnapshot')
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'metrics.upsertSnapshot' });
}
