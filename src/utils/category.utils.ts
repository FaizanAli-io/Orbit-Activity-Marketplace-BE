import { PrismaService } from '../prisma/prisma.service';

export async function getCategoryObjectsByIds(
  prisma: PrismaService,
  ids: number[],
): Promise<
  {
    categoryId: number | null;
    category: string | null;
    subcategoryId: number;
    subcategory: string;
  }[]
> {
  if (!ids || ids.length === 0) return [];
  const subcategories = await prisma.category.findMany({
    where: { id: { in: ids }, parentId: { not: null } },
    include: { parent: { select: { id: true, name: true } } },
  });

  return subcategories.map((cat) => ({
    categoryId: cat.parent?.id || null,
    category: cat.parent?.name || null,
    subcategoryId: cat.id,
    subcategory: cat.name,
  }));
}
