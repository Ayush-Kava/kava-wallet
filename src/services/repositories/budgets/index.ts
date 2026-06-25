import { prisma } from '@/lib/prisma';
import { resolveCategoryId } from '@/lib/utils/resolve-owned-resource';
import type { Budget, CreateBudgetData, UpdateBudgetData } from '@/types/budget-types';
import { toBudgetType } from '@/types/budget-types';

export const listByUser = async (userId: number): Promise<Budget[]> => {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });
  return budgets.map(toBudgetType);
};

export const create = async (userId: number, data: CreateBudgetData): Promise<void> => {
  const categoryId = await resolveCategoryId(userId, data.category_id);
  if (!categoryId) throw new Error('Invalid category');

  await prisma.budget.create({
    data: {
      userId,
      categoryId,
      amount: data.amount,
      period: data.period,
      start_date: new Date(data.start_date),
      end_date: data.end_date ? new Date(data.end_date) : null,
    },
  });
};

export const remove = async (userId: number, publicId: string): Promise<boolean> => {
  const result = await prisma.budget.deleteMany({ where: { publicId, userId } });
  return result.count > 0;
};

export const update = async (
  userId: number,
  publicId: string,
  data: UpdateBudgetData,
): Promise<boolean> => {
  const result = await prisma.budget.updateMany({
    where: { publicId, userId },
    data: {
      amount: data.amount,
      period: data.period,
      start_date: data.start_date ? new Date(data.start_date) : undefined,
      end_date:
        data.end_date !== undefined ? (data.end_date ? new Date(data.end_date) : null) : undefined,
    },
  });
  return result.count > 0;
};
