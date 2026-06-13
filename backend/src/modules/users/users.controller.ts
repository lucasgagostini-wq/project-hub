import { Request, Response } from 'express';

/** GET /users -> User[]  (todos veem todos) */
export async function list(_req: Request, res: Response) {
  // TODO: prisma.user.findMany (sem passwordHash)
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'users.list' });
}

/** GET /users/:id -> User */
export async function getById(_req: Request, res: Response) {
  // TODO: prisma.user.findUnique
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'users.getById' });
}

/** POST /users  Body: { name, email, password, role? } -> User  (criação de conta) */
export async function create(_req: Request, res: Response) {
  // TODO: hash bcrypt da senha, criar usuário, writeAudit(CREATE,'User')
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'users.create' });
}

/** PATCH /users/:id  Body: { name?, photoUrl?, password? } -> User  (editar perfil) */
export async function update(_req: Request, res: Response) {
  // TODO: atualizar perfil; writeAudit(UPDATE,'User')
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'users.update' });
}

/** GET /users/:id/calendar?from=&to= -> itens (tarefas+ações+reuniões) do usuário */
export async function calendar(_req: Request, res: Response) {
  // TODO: agregar Task(assignee=id) + OfferAction(responsible=id) + Meeting(participante)
  //       no intervalo. É o "calendário pessoal" — todos podem ver o de qualquer um.
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'users.calendar' });
}
