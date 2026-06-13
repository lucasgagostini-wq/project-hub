import { Router } from 'express';
import * as c from './users.controller';

export const usersRouter = Router();
usersRouter.get('/', c.list);
usersRouter.post('/', c.create);
usersRouter.get('/:id', c.getById);
usersRouter.patch('/:id', c.update);
usersRouter.get('/:id/calendar', c.calendar);
