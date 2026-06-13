import { Request, Response } from 'express';

/**
 * Resposta padrão dos endpoints ainda não ligados.
 * O dev troca o corpo de cada handler pela implementação real e remove esta chamada.
 */
export function notImplemented(handler: string) {
  return (_req: Request, res: Response) =>
    res.status(501).json({
      error: 'NOT_IMPLEMENTED',
      handler,
      message: `TODO: implementar ${handler}`,
    });
}
