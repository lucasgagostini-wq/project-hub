import { Router } from 'express';
import * as c from './metrics.controller';

// Montado em /projects
export const metricsRouter = Router();
metricsRouter.get('/:id/metrics', c.timeline);
metricsRouter.post('/:id/metrics', c.upsertSnapshot);
