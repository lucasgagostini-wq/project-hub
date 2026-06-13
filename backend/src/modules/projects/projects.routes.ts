import { Router } from 'express';
import * as c from './projects.controller';

export const projectsRouter = Router();
projectsRouter.get('/dashboard', c.dashboard); // KPIs da Home geral
projectsRouter.get('/', c.list);
projectsRouter.post('/', c.create);
projectsRouter.get('/:id', c.getById);
projectsRouter.get('/:id/overview', c.overview);
projectsRouter.patch('/:id', c.update);
projectsRouter.delete('/:id', c.remove);
