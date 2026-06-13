import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Seed opcional para ambiente de desenvolvimento.
 * TODO: criar usuários (com bcrypt), 2-3 projetos com oferta/persona/criativos
 * e alguns MetricSnapshot para o gráfico ter dados. Espelha o mock do protótipo.
 */
async function main() {
  console.log('TODO: popular dados de desenvolvimento');
}

main().finally(() => prisma.$disconnect());
