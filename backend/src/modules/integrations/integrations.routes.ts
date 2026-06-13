import { Router } from 'express';
import * as c from './integrations.controller';

// Montado na raiz da API: cobre /projects/:id/integrations e /webhooks/*
export const integrationsRouter = Router();

integrationsRouter.get('/projects/:id/integrations', c.list);
integrationsRouter.post('/projects/:id/integrations', c.connect);
integrationsRouter.delete('/projects/:id/integrations/:provider', c.disconnect);
integrationsRouter.post('/projects/:id/integrations/:provider/sync', c.sync);

integrationsRouter.post('/webhooks/utmfy', c.webhookUtmfy);
integrationsRouter.post('/webhooks/cakto', c.webhookCakto);
