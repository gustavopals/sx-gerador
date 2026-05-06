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

  const project = await prisma.project.upsert({
    where: { slug: 'projeto-seed' },
    update: {
      name: 'Projeto Seed',
      description: 'Projeto base para desenvolvimento local',
      visibility: 'PRIVATE',
      defaultTamFil: 2,
      defaultLang: 'pt-BR',
    },
    create: {
      name: 'Projeto Seed',
      slug: 'projeto-seed',
      description: 'Projeto base para desenvolvimento local',
      visibility: 'PRIVATE',
      defaultTamFil: 2,
      defaultLang: 'pt-BR',
    },
  });

  const table = await prisma.table.upsert({
    where: {
      projectId_prefix: {
        projectId: project.id,
        prefix: 'ZZZ',
      },
    },
    update: {
      fileName: 'ZZZ010',
      namePt: 'Cadastro Seed',
      nameEs: 'Cadastro Seed',
      nameEn: 'Seed Registry',
      routine: 'MATA010',
      uniqueKey: 'ZZZ_FILIAL+ZZZ_CODIGO',
      modules: 0,
      tamFil: 2,
      tamUn: 2,
      tamEmp: 2,
      notes: 'Tabela seed para desenvolvimento local',
      deletedAt: null,
    },
    create: {
      projectId: project.id,
      prefix: 'ZZZ',
      fileName: 'ZZZ010',
      namePt: 'Cadastro Seed',
      nameEs: 'Cadastro Seed',
      nameEn: 'Seed Registry',
      routine: 'MATA010',
      uniqueKey: 'ZZZ_FILIAL+ZZZ_CODIGO',
      modules: 0,
      tamFil: 2,
      tamUn: 2,
      tamEmp: 2,
      notes: 'Tabela seed para desenvolvimento local',
    },
  });

  const fieldsSeed = [
    {
      name: 'ZZZ_FILIAL',
      order: '01',
      type: 'C' as const,
      size: 2,
      decimals: 0,
      titlePt: 'Filial',
      titleEs: 'Sucursal',
      titleEn: 'Branch',
      descPt: 'Filial do sistema',
      descEs: 'Sucursal del sistema',
      descEn: 'System branch',
      picture: '@!',
      defaultRel: "xFilial('ZZZ')",
    },
    {
      name: 'ZZZ_CODIGO',
      order: '02',
      type: 'C' as const,
      size: 10,
      decimals: 0,
      titlePt: 'Codigo',
      titleEs: 'Codigo',
      titleEn: 'Code',
      descPt: 'Codigo do registro',
      descEs: 'Codigo del registro',
      descEn: 'Registry code',
      picture: '@!',
    },
    {
      name: 'ZZZ_NOME',
      order: '03',
      type: 'C' as const,
      size: 40,
      decimals: 0,
      titlePt: 'Nome',
      titleEs: 'Nombre',
      titleEn: 'Name',
      descPt: 'Nome do registro',
      descEs: 'Nombre del registro',
      descEn: 'Registry name',
      picture: '@!',
    },
    {
      name: 'ZZZ_VALOR',
      order: '04',
      type: 'N' as const,
      size: 15,
      decimals: 2,
      titlePt: 'Valor',
      titleEs: 'Valor',
      titleEn: 'Amount',
      descPt: 'Valor monetario',
      descEs: 'Valor monetario',
      descEn: 'Monetary amount',
      picture: '@E 999,999,999.99',
    },
    {
      name: 'ZZZ_STATUS',
      order: '05',
      type: 'C' as const,
      size: 1,
      decimals: 0,
      titlePt: 'Status',
      titleEs: 'Estado',
      titleEn: 'Status',
      descPt: 'Status do registro',
      descEs: 'Estado del registro',
      descEn: 'Registry status',
      comboPt: '1=Ativo;2=Inativo',
      comboEs: '1=Activo;2=Inactivo',
      comboEn: '1=Active;2=Inactive',
    },
  ];

  for (const field of fieldsSeed) {
    await prisma.field.upsert({
      where: {
        tableId_name: {
          tableId: table.id,
          name: field.name,
        },
      },
      update: {
        ...field,
        deletedAt: null,
      },
      create: {
        tableId: table.id,
        ...field,
      },
    });
  }

  console.log('Seed concluido.');
  console.log('Usuario: dev@sxgerador.local | Senha: dev123456');
  console.log(
    `Projeto: ${project.slug} | Tabela: ${table.prefix} | Campos seed: ${fieldsSeed.length}`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
