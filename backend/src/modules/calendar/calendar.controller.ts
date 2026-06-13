import { Request, Response } from 'express';

/** GET /calendar?userId=&from=&to= -> itens unificados
 *  Junta Task + OfferAction + Meeting de todos (ou de um userId).
 *  É o Calendário Geral; com ?userId vira o calendário pessoal de alguém. */
export async function feed(_req: Request, res: Response) {
  // TODO: agregar as três fontes no intervalo e ordenar por data
  return res.status(501).json({ error: 'NOT_IMPLEMENTED', handler: 'calendar.feed' });
}
