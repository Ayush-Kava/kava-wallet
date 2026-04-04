import { prisma } from '@/lib/prisma';
import type { Category, CreateCategoryData } from '@/types/category-types';
import { toCategoryType } from '@/types/category-types';

export const listForUser = async (userId: string): Promise<Category[]> => {
  const categories = await prisma.category.findMany({ where: { userId } });
  return categories.map(toCategoryType);
};

export const create = async (
  userId: string,
  data: CreateCategoryData,
): Promise<Category> => {
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
