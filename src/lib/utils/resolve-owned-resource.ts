import { prisma } from '@/lib/prisma';
import { OwnershipError } from '@/services/repositories/accounts/ownership';
import type { LinkedEntityType } from '@/types/document-types';
import type { AccountKind } from '@prisma/client';

type OwnedModel =
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
  | 'documentReminder';

const activeAccountWhere = (userId: number, publicId: string, kind?: AccountKind) => ({
  publicId,
  userId,
  deletedAt: null,
  ...(kind ? { kind } : {}),
});

const modelDelegates: Record<
  OwnedModel,
  { findFirst: (args: object) => Promise<{ id: number } | null> }
> = {
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
};

export const resolveOwnedId = async (
  model: OwnedModel,
  userId: number,
  publicId: string,
): Promise<number | null> => {
  const delegate = modelDelegates[model];
  const where =
    model === 'category'
      ? { publicId, OR: [{ userId }, { userId: null, is_default: true }] }
      : { publicId, userId };

  const row = await delegate.findFirst({ where, select: { id: true } });
  return row?.id ?? null;
};

export const resolveAccountId = async (
  userId: number,
  publicId: string,
  kind?: AccountKind,
): Promise<number | null> => {
  const account = await prisma.account.findFirst({
    where: activeAccountWhere(userId, publicId, kind),
    select: { id: true },
  });
  return account?.id ?? null;
};

export const resolveCategoryId = (userId: number, publicId: string) =>
  resolveOwnedId('category', userId, publicId);

export const resolveActiveBankId = async (publicId: string): Promise<number | null> => {
  const bank = await prisma.bank.findFirst({
    where: { publicId, isActive: true },
    select: { id: true },
  });
  return bank?.id ?? null;
};

/** @deprecated Use resolveActiveBankId */
export const resolveBankId = resolveActiveBankId;

export const assertLinkedEntityOwnership = async (
  userId: number,
  entityType: LinkedEntityType,
  publicId: string,
): Promise<void> => {
  let owned = false;

  switch (entityType) {
    case 'account': {
      owned = !!(await resolveAccountId(userId, publicId));
      break;
    }
    case 'credit_card': {
      owned = !!(await resolveAccountId(userId, publicId, 'credit_card'));
      break;
    }
    case 'transaction': {
      owned = !!(await resolveOwnedId('transaction', userId, publicId));
      break;
    }
    case 'loan':
    case 'emi': {
      owned = !!(await resolveOwnedId('loan', userId, publicId));
      break;
    }
    case 'investment': {
      owned = !!(await resolveOwnedId('investment', userId, publicId));
      break;
    }
    default:
      break;
  }

  if (!owned) {
    throw new OwnershipError('Linked entity not found or access denied');
  }
};
