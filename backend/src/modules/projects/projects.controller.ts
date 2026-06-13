import { Request, Response } from 'express';

/** GET /projects?active= -> Project[] (cards da aba Projetos) */
export async function list(_req: Request, res: Response) {
  // TODO: prisma.project.findMany com KPIs resumidos (faturamento, veículo, tempo no ar)
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'projects.list' });
}

/** GET /dashboard -> { faturamentoTotal, projetosAtivos, destaque } (KPIs da Home geral) */
export async function dashboard(_req: Request, res: Response) {
  // TODO: somar faturamento dos ativos; contar ativos; destaque = maior faturamento na semana
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'projects.dashboard' });
}

/** POST /projects  Body: dados do projeto + oferta + persona (tudo opcional menos name) */
export async function create(_req: Request, res: Response) {
  // TODO: criar Project + Offer + Persona + OfferLink(s) numa transação; writeAudit(CREATE,'Project')
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'projects.create' });
}

/** GET /projects/:id -> Project completo */
export async function getById(_req: Request, res: Response) {
  // TODO: include offer, persona, links, creatives, integrations
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'projects.getById' });
}

/** GET /projects/:id/overview -> KPIs do projeto (faturamento, lucro, gasto, tempo, top3 criativos) */
export async function overview(_req: Request, res: Response) {
  // TODO: derivar dos MetricSnapshot + Creative(order by sales desc, take 3)
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'projects.overview' });
}

/** PATCH /projects/:id  Body: { name?, niche?, active? } */
export async function update(_req: Request, res: Response) {
  // TODO: atualizar; writeAudit(UPDATE,'Project')
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'projects.update' });
}

/** DELETE /projects/:id  (recomendado: soft delete via active=false) */
export async function remove(_req: Request, res: Response) {
  // TODO: desativar; writeAudit(DELETE,'Project')
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'projects.remove' });
}
