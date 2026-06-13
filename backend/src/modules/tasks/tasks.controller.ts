import { Request, Response } from 'express';

/** GET /tasks?projectId=&assigneeId=&done= -> Task[] */
export async function list(_req: Request, res: Response) {
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'tasks.list' });
}
/** POST /tasks  Body: { title, projectId?, assigneeId?, dueDate? }
 *  Com responsável+data, aparece no calendário pessoal dele. */
export async function create(_req: Request, res: Response) {
  // TODO: criar; writeAudit(CREATE,'Task')
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'tasks.create' });
}
/** PATCH /tasks/:id  Body: { title?, assigneeId?, dueDate?, done? } */
export async function update(_req: Request, res: Response) {
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'tasks.update' });
}
/** DELETE /tasks/:id */
export async function remove(_req: Request, res: Response) {
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'tasks.remove' });
}
