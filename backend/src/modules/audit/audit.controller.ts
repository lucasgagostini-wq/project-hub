import { Request, Response } from 'express';

/** GET /audit?projectId=&userId=&entityType=&cursor=&limit= -> AuditLog[] paginado
 *  Feed de rastreamento. Em /projects/:id é filtrado por projectId. */
export async function list(_req: Request, res: Response) {
  // TODO: prisma.auditLog.findMany com filtros + include user; paginação por cursor
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'audit.list' });
}
