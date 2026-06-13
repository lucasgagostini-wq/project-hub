import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../lib/http';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.code, message: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'INTERNAL', message: 'Erro inesperado' });
}
