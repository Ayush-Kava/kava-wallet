import { prisma } from '@/lib/prisma';
import type { Category, CreateCategoryData } from '@/types/category-types';
import { toCategoryType } from '@/types/category-types';

export const listForUser = async (userId: string): Promise<Category[]> => {
  const categories = await prisma.category.findMany({
    where: { OR: [{ userId }, { userId: null, is_default: true }] },
    orderBy: { name: 'asc' },
  });
  return categories.map(toCategoryType);
};

export const seedDefaultsForUser = async (userId: string): Promise<void> => {
  const { DEFAULT_CATEGORIES } = await import('@/lib/constants/default-categories');
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map(c => ({
      userId,
      name: c.name,
      type: c.type,
      icon: c.icon,
      color: c.color,
      is_default: c.is_default,
    })),
    skipDuplicates: true,
  });
};

export const create = async (userId: string, data: CreateCategoryData): Promise<Category> => {
  const created = await prisma.category.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      icon: data.icon,
      color: data.color,
    },
  });
  return toCategoryType(created);
};
