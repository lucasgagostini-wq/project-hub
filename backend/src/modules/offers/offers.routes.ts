import { Router } from 'express';
import * as c from './offers.controller';

// Montado em /projects — todas as sub-rotas da gestão de oferta.
export const offersRouter = Router();

offersRouter.get('/:id/offer', c.getOffer);
offersRouter.put('/:id/offer', c.upsertOffer);

offersRouter.get('/:id/links', c.listLinks);
offersRouter.post('/:id/links', c.addLink);
offersRouter.delete('/:id/links/:linkId', c.removeLink);

offersRouter.get('/:id/persona', c.getPersona);
offersRouter.put('/:id/persona', c.upsertPersona);

offersRouter.get('/:id/creatives', c.listCreatives);
offersRouter.post('/:id/creatives', c.addCreative);
offersRouter.patch('/:id/creatives/:creativeId', c.updateCreative);
offersRouter.delete('/:id/creatives/:creativeId', c.removeCreative);

offersRouter.get('/:id/actions', c.listActions);
offersRouter.post('/:id/actions', c.addAction);
offersRouter.patch('/:id/actions/:actionId', c.updateAction);
offersRouter.delete('/:id/actions/:actionId', c.removeAction);
