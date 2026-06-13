import { Request } from 'express';
// import { prisma } from '../lib/prisma';

export interface AuditInput {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
  entityType: string;          // "Project" | "Persona" | "Offer" | "Task" ...
  entityId: string;
  projectId?: string;
  before?: unknown;
  after?: unknown;
}

/**
 * RASTREAMENTO — registra quem mexeu em quê.
 * Chame isto dentro de todo handler que cria, edita ou apaga algo,
 * passando o req (para pegar req.user) e o que mudou.
 *
 * TODO: descomentar o prisma.auditLog.create abaixo após a auth popular req.user.
 *
 * Ex.:
 *   const before = await prisma.persona.findUnique(...);
 *   const after  = await prisma.persona.update(...);
 *   await writeAudit(req, { action:'UPDATE', entityType:'Persona', entityId: after.id, projectId, before, after });
 */
export async function writeAudit(req: Request, input: AuditInput) {
  // await prisma.auditLog.create({
  //   data: {
  //     userId: req.user?.id ?? null,
  //     action: input.action,
  //     entityType: input.entityType,
  //     entityId: input.entityId,
  //     projectId: input.projectId ?? null,
  //     before: (input.before as any) ?? undefined,
  //     after: (input.after as any) ?? undefined,
  //   },
  // });
  void req;
  void input;
}
