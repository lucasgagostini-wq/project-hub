import { Request, Response } from 'express';

// ----- Estruturação da oferta -----
/** GET /projects/:id/offer */
export async function getOffer(_req: Request, res: Response) {
  // TODO: prisma.offer.findUnique({ where:{ projectId } })
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'offers.getOffer' });
}
/** PUT /projects/:id/offer  Body: { description?, audience?, ageRange?, mainChannel? } */
export async function upsertOffer(_req: Request, res: Response) {
  // TODO: upsert; writeAudit(UPDATE,'Offer', projectId)
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'offers.upsertOffer' });
}

// ----- Links -----
/** GET /projects/:id/links */
export async function listLinks(_req: Request, res: Response) {
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'offers.listLinks' });
}
/** POST /projects/:id/links  Body: { type, url } */
export async function addLink(_req: Request, res: Response) {
  // TODO: criar; writeAudit(CREATE,'OfferLink')
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'offers.addLink' });
}
/** DELETE /projects/:id/links/:linkId */
export async function removeLink(_req: Request, res: Response) {
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'offers.removeLink' });
}

// ----- Persona -----
/** GET /projects/:id/persona */
export async function getPersona(_req: Request, res: Response) {
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'offers.getPersona' });
}
/** PUT /projects/:id/persona  Body: { who?, pain?, desire?, objection?, channel? } */
export async function upsertPersona(_req: Request, res: Response) {
  // TODO: upsert; writeAudit(UPDATE,'Persona', projectId) — guardar before/after
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'offers.upsertPersona' });
}

// ----- Criativos -----
/** GET /projects/:id/creatives?top= */
export async function listCreatives(_req: Request, res: Response) {
  // TODO: order by sales desc; ?top=3 para o card do overview
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'offers.listCreatives' });
}
/** POST /projects/:id/creatives  Body: { name, sales?, spend?, revenue? } */
export async function addCreative(_req: Request, res: Response) {
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'offers.addCreative' });
}
/** PATCH /projects/:id/creatives/:creativeId */
export async function updateCreative(_req: Request, res: Response) {
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'offers.updateCreative' });
}
/** DELETE /projects/:id/creatives/:creativeId */
export async function removeCreative(_req: Request, res: Response) {
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'offers.removeCreative' });
}

// ----- Ações / mudanças (calendário da oferta) -----
/** GET /projects/:id/actions?from=&to= -> pontos do calendário da oferta */
export async function listActions(_req: Request, res: Response) {
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'offers.listActions' });
}
/** POST /projects/:id/actions  Body: { date, label, responsibleId? }
 *  Se tiver responsável+data, aparece no calendário pessoal dele. */
export async function addAction(_req: Request, res: Response) {
  // TODO: criar OfferAction; writeAudit(CREATE,'OfferAction')
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'offers.addAction' });
}
/** PATCH /projects/:id/actions/:actionId */
export async function updateAction(_req: Request, res: Response) {
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'offers.updateAction' });
}
/** DELETE /projects/:id/actions/:actionId */
export async function removeAction(_req: Request, res: Response) {
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'offers.removeAction' });
}
