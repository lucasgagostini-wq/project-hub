import { Request, Response } from 'express';

/** POST /auth/login  Body: { email, password } -> { token, user } */
export async function login(_req: Request, res: Response) {
  // TODO: buscar usuário por email, comparar bcrypt, assinar JWT, gravar AuditLog(LOGIN)
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'auth.login' });
}

/** POST /auth/logout -> 204 */
export async function logout(_req: Request, res: Response) {
  // TODO: invalidar sessão se usar lista de revogação (JWT stateless pode só responder 204)
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'auth.logout' });
}

/** GET /auth/me -> { user } (perfil do usuário logado) */
export async function me(_req: Request, res: Response) {
  // TODO: retornar req.user com nome, foto, papel
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'auth.me' });
}
