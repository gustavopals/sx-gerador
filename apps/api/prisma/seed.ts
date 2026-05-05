import 'dotenv/config';
import { hash as bcryptHash } from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

const DEV_PASSWORD = 'dev123456';
const BCRYPT_ROUNDS = 12;

async function main(): Promise<void> {
  const passwordHash = await bcryptHash(DEV_PASSWORD, BCRYPT_ROUNDS);

  await prisma.user.upsert({
    where: {
      email: 'dev@sxgerador.local',
    },
    update: {
      name: 'Dev SXGerador',
      passwordHash,
      emailVerified: true,
      locale: 'pt-BR',
    },
    create: {
      email: 'dev@sxgerador.local',
      name: 'Dev SXGerador',
      passwordHash,
      emailVerified: true,
      locale: 'pt-BR',
    },
  });

  console.log('Seed concluído. Usuário: dev@sxgerador.local | Senha: dev123456');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
