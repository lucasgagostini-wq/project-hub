import { Router } from 'express';
import * as c from './calendar.controller';

export const calendarRouter = Router();
calendarRouter.get('/', c.feed);
