import { prisma } from '@/lib/prisma';

type OwnedModel =
  | 'account'
  | 'transaction'
  | 'budget'
  | 'category'
  | 'recurringRule'
  | 'loan'
  | 'goal'
  | 'goalFunding'
  | 'investment'
  | 'document'
  | 'documentLink'
  | 'documentReminder'
  | 'bank';

const modelDelegates: Record<OwnedModel, { findFirst: (args: object) => Promise<{ id: number } | null> }> = {
  account: prisma.account,
  transaction: prisma.transaction,
  budget: prisma.budget,
  category: prisma.category,
  recurringRule: prisma.recurringRule,
  loan: prisma.loan,
  goal: prisma.goal,
  goalFunding: prisma.goalFunding,
  investment: prisma.investment,
  document: prisma.document,
  documentLink: prisma.documentLink,
  documentReminder: prisma.documentReminder,
  bank: prisma.bank,
};

export const resolveOwnedId = async (
  model: OwnedModel,
  userId: number | null,
  publicId: string,
): Promise<number | null> => {
  const delegate = modelDelegates[model];
  const where =
    model === 'bank'
      ? { publicId }
      : model === 'category'
        ? { publicId, OR: [{ userId }, { userId: null, is_default: true }] }
        : { publicId, userId };

  const row = await delegate.findFirst({ where, select: { id: true } });
  return row?.id ?? null;
};

export const resolveAccountId = (userId: number, publicId: string) =>
  resolveOwnedId('account', userId, publicId);

export const resolveCategoryId = (userId: number, publicId: string) =>
  resolveOwnedId('category', userId, publicId);

export const resolveBankId = (publicId: string) => resolveOwnedId('bank', null, publicId);
