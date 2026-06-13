import { Router } from 'express';
import * as c from './meetings.controller';

export const meetingsRouter = Router();
meetingsRouter.get('/', c.list);
meetingsRouter.post('/', c.create);
meetingsRouter.patch('/:id', c.update);
meetingsRouter.delete('/:id', c.remove);
