import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  integrations: {
    utmfy: { base: process.env.UTMFY_API_BASE, token: process.env.UTMFY_API_TOKEN },
    cakto: { base: process.env.CAKTO_API_BASE, token: process.env.CAKTO_API_TOKEN, webhookSecret: process.env.CAKTO_WEBHOOK_SECRET },
  },
};
