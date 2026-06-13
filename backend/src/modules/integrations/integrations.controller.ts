import { Request, Response } from 'express';

/** GET /projects/:id/integrations -> IntegrationConfig[] (status por provedor) */
export async function list(_req: Request, res: Response) {
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'integrations.list' });
}

/** POST /projects/:id/integrations  Body: { provider, externalAccountId, credentialRef }
 *  Conecta o projeto a uma conta externa (UTMFY|CAKTO). */
export async function connect(_req: Request, res: Response) {
  // TODO: validar credenciais com o provider, salvar IntegrationConfig(status=CONNECTED)
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'integrations.connect' });
}

/** DELETE /projects/:id/integrations/:provider */
export async function disconnect(_req: Request, res: Response) {
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'integrations.disconnect' });
}

/** POST /projects/:id/integrations/:provider/sync
 *  Puxa métricas do provider e grava MetricSnapshot. Chamar via cron ou manualmente. */
export async function sync(_req: Request, res: Response) {
  // TODO: chamar o client do provider (providers/*.ts), normalizar e upsert nos snapshots
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'integrations.sync' });
}

// ---- Webhooks (entrada de eventos das plataformas) ----
/** POST /webhooks/utmfy */
export async function webhookUtmfy(_req: Request, res: Response) {
  // TODO: validar assinatura, mapear evento -> MetricSnapshot
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'integrations.webhookUtmfy' });
}
/** POST /webhooks/cakto */
export async function webhookCakto(_req: Request, res: Response) {
  // TODO: validar CAKTO_WEBHOOK_SECRET, registrar venda/refund
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'integrations.webhookCakto' });
}
