import { prisma } from '@/lib/prisma';
import { assertAccountOwnership } from '@/services/repositories/accounts/ownership';
import type { Investment, InvestmentDetail, CreateInvestmentData } from '@/types/investment-types';
import { toInvestmentType } from '@/types/investment-types';

export const listByUser = async (userId: string): Promise<Investment[]> => {
  const investments = await prisma.investment.findMany({
    where: { userId },
    include: { account: true },
    orderBy: { createdAt: 'desc' },
  });
  return investments.map(toInvestmentType);
};

export const getById = async (userId: string, id: string): Promise<InvestmentDetail | null> => {
  const investment = await prisma.investment.findFirst({
    where: { id, userId },
    include: { account: true },
  });
  if (!investment) return null;

  const links = await prisma.documentLink.findMany({
    where: { userId, linked_entity_id: id },
    include: { document: true },
  });

  return {
    ...toInvestmentType(investment),
    linkedDocuments: links.map(l => ({
      id: l.document.id,
      name: l.document.name,
    })),
  };
};

export const listByAccount = async (userId: string, accountId: string): Promise<Investment[]> => {
  const investments = await prisma.investment.findMany({
    where: { userId, accountId },
    include: { account: true },
    orderBy: { createdAt: 'desc' },
  });
  return investments.map(toInvestmentType);
};

export const create = async (userId: string, data: CreateInvestmentData): Promise<Investment> => {
  await assertAccountOwnership(userId, data.account_id);

  const created = await prisma.investment.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      invested_amount: data.invested_amount,
      current_value: data.current_value,
      accountId: data.account_id,
      start_date: new Date(data.start_date),
      notes: data.notes,
    },
    include: { account: true },
  });
  return toInvestmentType(created);
};

export const update = async (
  userId: string,
  id: string,
  data: Partial<CreateInvestmentData>,
): Promise<boolean> => {
  if (data.account_id) {
    await assertAccountOwnership(userId, data.account_id);
  }

  const result = await prisma.investment.updateMany({
    where: { id, userId },
    data: {
      name: data.name,
      type: data.type,
      invested_amount: data.invested_amount,
      current_value: data.current_value,
      accountId: data.account_id,
      start_date: data.start_date ? new Date(data.start_date) : undefined,
      notes: data.notes,
    },
  });
  return result.count > 0;
};

export const remove = async (userId: string, id: string): Promise<boolean> => {
  const result = await prisma.investment.deleteMany({ where: { id, userId } });
  return result.count > 0;
};

export const getTotalInvested = async (userId: string): Promise<number> => {
  const result = await prisma.investment.aggregate({
    where: { userId },
    _sum: { invested_amount: true },
  });
  return Number(result._sum.invested_amount ?? 0);
};

export const getTotalCurrentValue = async (userId: string): Promise<number> => {
  const result = await prisma.investment.aggregate({
    where: { userId },
    _sum: { current_value: true },
  });
  return Number(result._sum.current_value ?? 0);
};
