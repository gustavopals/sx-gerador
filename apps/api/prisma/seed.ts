import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.user.upsert({
    where: {
      email: 'dev@sxgerador.local',
    },
    update: {
      name: 'Dev SXGerador',
      emailVerified: true,
      locale: 'pt-BR',
    },
    create: {
      email: 'dev@sxgerador.local',
      name: 'Dev SXGerador',
      passwordHash: 'dev-password-hash',
      emailVerified: true,
      locale: 'pt-BR',
    },
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
