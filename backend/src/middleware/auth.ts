import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../lib/http';

// Identidade do usuário disponível em todo handler autenticado.
export interface AuthUser {
  id: string;
  name: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Exige um token válido e popula req.user.
 * TODO: validar o JWT (jsonwebtoken.verify com env.jwtSecret), buscar o
 * usuário e preencher req.user. Hoje apenas bloqueia se não houver header.
 *
 * Regra do produto: todos os usuários autenticados têm acesso a tudo —
 * então NÃO há checagem de papel por recurso. A identidade é usada para
 * o rastreamento (AuditLog).
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'UNAUTHENTICATED', 'Token ausente'));
  }
  // TODO: const payload = jwt.verify(token, env.jwtSecret); req.user = ...
  return next();
}
