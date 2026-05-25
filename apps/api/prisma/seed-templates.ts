import type { PrismaClient } from '../src/generated/prisma';
import { OFFICIAL_TEMPLATES } from './data/official-templates';

export async function seedOfficialTemplates(prisma: PrismaClient): Promise<void> {
  for (const item of OFFICIAL_TEMPLATES) {
    const existing = await prisma.template.findFirst({
      where: { name: item.name, isOfficial: true },
    });
    if (existing) {
      await prisma.template.update({
        where: { id: existing.id },
        data: {
          description: item.description,
          category: item.category,
          content: item.content,
          sourceTablePrefix: item.sourceTablePrefix,
        },
      });
      continue;
    }

    await prisma.template.create({
      data: {
        authorId: null,
        name: item.name,
        description: item.description,
        category: item.category,
        content: item.content,
        sourceTablePrefix: item.sourceTablePrefix,
        isOfficial: true,
        downloads: 0,
      },
    });
  }
}
