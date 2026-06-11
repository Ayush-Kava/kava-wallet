import { prisma } from '@/lib/prisma';
import type { Budget, CreateBudgetData } from '@/types/budget-types';
import { toBudgetType } from '@/types/budget-types';

export const listByUser = async (userId: string): Promise<Budget[]> => {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });
  return budgets.map(toBudgetType);
};

export const create = async (userId: string, data: CreateBudgetData): Promise<void> => {
  await prisma.budget.create({
    data: {
      userId,
      categoryId: data.category_id,
      amount: data.amount,
      period: data.period,
      start_date: new Date(data.start_date),
      end_date: data.end_date ? new Date(data.end_date) : null,
    },
  });
};

export const remove = async (userId: string, id: string): Promise<boolean> => {
  const result = await prisma.budget.deleteMany({ where: { id, userId } });
  return result.count > 0;
};
