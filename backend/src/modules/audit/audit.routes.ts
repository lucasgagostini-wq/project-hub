import { Router } from 'express';
import * as c from './audit.controller';

export const auditRouter = Router();
auditRouter.get('/', c.list);
