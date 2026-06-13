import { Router } from 'express';
import * as c from './tasks.controller';

export const tasksRouter = Router();
tasksRouter.get('/', c.list);
tasksRouter.post('/', c.create);
tasksRouter.patch('/:id', c.update);
tasksRouter.delete('/:id', c.remove);
