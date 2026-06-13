import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { router } from './routes';
import { errorHandler } from './middleware/error';

export const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

// Todas as rotas da API ficam sob /api/v1
app.use('/api/v1', router);

app.use(errorHandler);
