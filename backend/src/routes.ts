import { Router } from 'express';
import { requireAuth } from './middleware/auth';

import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { projectsRouter } from './modules/projects/projects.routes';
import { offersRouter } from './modules/offers/offers.routes';
import { metricsRouter } from './modules/metrics/metrics.routes';
import { tasksRouter } from './modules/tasks/tasks.routes';
import { meetingsRouter } from './modules/meetings/meetings.routes';
import { calendarRouter } from './modules/calendar/calendar.routes';
import { auditRouter } from './modules/audit/audit.routes';
import { integrationsRouter } from './modules/integrations/integrations.routes';

export const router = Router();

// Público
router.use('/auth', authRouter);

// A partir daqui exige autenticação (identidade serve ao rastreamento)
router.use(requireAuth);

router.use('/users', usersRouter);
router.use('/projects', projectsRouter);          // inclui /projects/:id/offer, /persona, /links, /creatives, /actions
router.use('/projects', offersRouter);            // sub-rotas de gestão de oferta
router.use('/projects', metricsRouter);           // /projects/:id/metrics
router.use('/tasks', tasksRouter);
router.use('/meetings', meetingsRouter);
router.use('/calendar', calendarRouter);
router.use('/audit', auditRouter);
router.use('/', integrationsRouter);              // /projects/:id/integrations + /webhooks/*
