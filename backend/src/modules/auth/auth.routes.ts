import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as c from './auth.controller';

export const authRouter = Router();
authRouter.post('/login', c.login);
authRouter.post('/logout', c.logout);
authRouter.get('/me', requireAuth, c.me);
