import { prisma } from '@/lib/prisma';
import type { Category, CreateCategoryData, UpdateCategoryData } from '@/types/category-types';
import { toCategoryType } from '@/types/category-types';

export const listForUser = async (userId: number): Promise<Category[]> => {
  const categories = await prisma.category.findMany({
    where: { OR: [{ userId }, { userId: null, is_default: true }] },
    orderBy: { name: 'asc' },
  });
  return categories.map(toCategoryType);
};

export const seedDefaultsForUser = async (userId: number): Promise<void> => {
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

export const create = async (userId: number, data: CreateCategoryData): Promise<Category> => {
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

export const update = async (
  userId: number,
  publicId: string,
  data: UpdateCategoryData,
): Promise<Category | null> => {
  const existing = await prisma.category.findFirst({
    where: { publicId, userId },
  });
  if (!existing) return null;

  const updated = await prisma.category.update({
    where: { id: existing.id },
    data: {
      name: data.name,
      color: data.color,
      icon: data.icon,
    },
  });
  return toCategoryType(updated);
};

export const remove = async (
  userId: number,
  publicId: string,
): Promise<{ ok: true } | { ok: false; reason: string }> => {
  const existing = await prisma.category.findFirst({
    where: { publicId, userId },
  });
  if (!existing) return { ok: false, reason: 'not_found' };
  if (existing.is_default) return { ok: false, reason: 'default_category' };

  const [transactionCount, budgetCount] = await Promise.all([
    prisma.transaction.count({ where: { categoryId: existing.id, userId } }),
    prisma.budget.count({ where: { categoryId: existing.id, userId } }),
  ]);

  if (transactionCount > 0) {
    return { ok: false, reason: 'has_transactions' };
  }
  if (budgetCount > 0) {
    return { ok: false, reason: 'has_budgets' };
  }

  await prisma.category.delete({ where: { id: existing.id } });
  return { ok: true };
};
