import { Request, Response } from 'express';

/** GET /meetings?from=&to= -> Meeting[] (com participantes) */
export async function list(_req: Request, res: Response) {
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'meetings.list' });
}
/** POST /meetings  Body: { title, date, time?, participantIds: string[] } */
export async function create(_req: Request, res: Response) {
  // TODO: criar Meeting + MeetingParticipant; writeAudit(CREATE,'Meeting')
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'meetings.create' });
}
/** PATCH /meetings/:id */
export async function update(_req: Request, res: Response) {
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'meetings.update' });
}
/** DELETE /meetings/:id */
export async function remove(_req: Request, res: Response) {
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'meetings.remove' });
}
