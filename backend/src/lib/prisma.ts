import { PrismaClient } from '@prisma/client';

// Cliente único reaproveitado em toda a aplicação.
export const prisma = new PrismaClient();
