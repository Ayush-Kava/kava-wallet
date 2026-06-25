import { prisma } from '@/lib/prisma';
import { applyTransactionDelta, applyTransferDeltas } from '@/lib/money';
import { computeNextRunDate } from '@/lib/recurring-utils';
import { resolveCategoryId } from '@/lib/utils/resolve-owned-resource';
import {
  assertAccountOwnership,
  assertAccountsOwnership,
} from '@/services/repositories/accounts/ownership';
import type { RecurringRule, CreateRecurringRuleData } from '@/types/recurring-types';
import { toRecurringRuleType } from '@/types/recurring-types';
import type { RecurringRule as PrismaRecurringRule } from '@prisma/client';

const recurringRuleInclude = {
  account: true,
  fromAccount: true,
  toAccount: true,
  category: true,
  loan: true,
} as const;

const todayString = (): string => new Date().toISOString().slice(0, 10);

const resolveOptionalLoanId = async (
  userId: number,
  publicId?: string | null,
): Promise<number | null> => {
  if (!publicId) return null;
  const loan = await prisma.loan.findFirst({
    where: { publicId, userId },
    select: { id: true },
  });
  if (!loan) throw new Error('Invalid loan');
  return loan.id;
};

const resolveFkIds = async (userId: number, data: Partial<CreateRecurringRuleData>) => {
  const accountId =
    data.account_id !== undefined
      ? data.account_id
        ? await assertAccountOwnership(userId, data.account_id)
        : null
      : undefined;

  const fromAccountId =
    data.from_account_id !== undefined
      ? data.from_account_id
        ? await assertAccountOwnership(userId, data.from_account_id)
        : null
      : undefined;

  const toAccountId =
    data.to_account_id !== undefined
      ? data.to_account_id
        ? await assertAccountOwnership(userId, data.to_account_id)
        : null
      : undefined;

  let categoryId: number | null | undefined;
  if (data.category_id !== undefined) {
    if (data.category_id) {
      categoryId = await resolveCategoryId(userId, data.category_id);
      if (!categoryId) throw new Error('Invalid category');
    } else {
      categoryId = null;
    }
  }

  const loanId =
    data.loan_id !== undefined
      ? await resolveOptionalLoanId(userId, data.loan_id)
      : undefined;

  return { accountId, fromAccountId, toAccountId, categoryId, loanId };
};

export const listByUser = async (userId: number): Promise<RecurringRule[]> => {
  const rules = await prisma.recurringRule.findMany({
    where: { userId },
    include: recurringRuleInclude,
    orderBy: { next_run_date: 'asc' },
  });
  return rules.map(toRecurringRuleType);
};

export const getById = async (userId: number, publicId: string): Promise<RecurringRule | null> => {
  const rule = await prisma.recurringRule.findFirst({
    where: { publicId, userId },
    include: recurringRuleInclude,
  });
  return rule ? toRecurringRuleType(rule) : null;
};

export const create = async (userId: number, data: CreateRecurringRuleData): Promise<void> => {
  if (data.from_account_id && data.to_account_id) {
    await assertAccountsOwnership(userId, [data.from_account_id, data.to_account_id]);
  } else if (data.account_id) {
    await assertAccountOwnership(userId, data.account_id);
  }

  const { accountId, fromAccountId, toAccountId, categoryId, loanId } = await resolveFkIds(
    userId,
    data,
  );

  await prisma.recurringRule.create({
    data: {
      userId,
      name: data.name,
      description: data.description,
      type: data.type,
      frequency: data.frequency,
      amount: data.amount,
      accountId: accountId ?? null,
      fromAccountId: fromAccountId ?? null,
      toAccountId: toAccountId ?? null,
      categoryId: categoryId ?? null,
      loanId: loanId ?? null,
      next_run_date: new Date(data.next_run_date),
      end_date: data.end_date ? new Date(data.end_date) : null,
      paused: data.paused ?? false,
    },
  });
};

export const update = async (
  userId: number,
  publicId: string,
  data: Partial<CreateRecurringRuleData>,
): Promise<boolean> => {
  if (data.from_account_id && data.to_account_id) {
    await assertAccountsOwnership(userId, [data.from_account_id, data.to_account_id]);
  } else if (data.account_id) {
    await assertAccountOwnership(userId, data.account_id);
  }

  const { accountId, fromAccountId, toAccountId, categoryId, loanId } = await resolveFkIds(
    userId,
    data,
  );

  const result = await prisma.recurringRule.updateMany({
    where: { publicId, userId },
    data: {
      name: data.name,
      description: data.description,
      type: data.type,
      frequency: data.frequency,
      amount: data.amount,
      accountId,
      fromAccountId,
      toAccountId,
      categoryId,
      loanId,
      next_run_date: data.next_run_date ? new Date(data.next_run_date) : undefined,
      end_date:
        data.end_date === undefined ? undefined : data.end_date ? new Date(data.end_date) : null,
      paused: data.paused,
    },
  });
  return result.count > 0;
};

export const remove = async (userId: number, publicId: string): Promise<boolean> => {
  const result = await prisma.recurringRule.deleteMany({
    where: { publicId, userId },
  });
  return result.count > 0;
};

export const setPaused = async (
  userId: number,
  publicId: string,
  paused: boolean,
): Promise<boolean> => {
  const result = await prisma.recurringRule.updateMany({
    where: { publicId, userId },
    data: { paused },
  });
  return result.count > 0;
};

const executeRule = async (userId: number, rule: PrismaRecurringRule): Promise<void> => {
  const amount = Number(rule.amount);
  const date = rule.next_run_date;

  await prisma.$transaction(async tx => {
    if (rule.type === 'transfer') {
      if (!rule.fromAccountId || !rule.toAccountId) return;
      const expense = await tx.transaction.create({
        data: {
          userId,
          accountId: rule.fromAccountId,
          type: 'expense',
          amount,
          description: rule.description || rule.name,
          date,
        },
      });
      const transferId = expense.id;
      await tx.transaction.update({
        where: { id: transferId },
        data: { transfer_id: transferId },
      });
      await tx.transaction.create({
        data: {
          userId,
          accountId: rule.toAccountId,
          type: 'income',
          amount,
          description: rule.description || rule.name,
          date,
          transfer_id: transferId,
        },
      });
      await applyTransferDeltas(tx, rule.fromAccountId, rule.toAccountId, amount);
    } else if (rule.accountId) {
      const txType = rule.type === 'income' ? 'income' : 'expense';
      await tx.transaction.create({
        data: {
          userId,
          accountId: rule.accountId,
          categoryId: rule.categoryId,
          type: txType,
          amount,
          description: rule.description || rule.name,
          date,
        },
      });
      await applyTransactionDelta(tx, rule.accountId, txType, amount);
    }

    if (rule.loanId) {
      const loan = await tx.loan.findFirst({
        where: { id: rule.loanId, userId },
      });
      if (loan) {
        const newBalance = Math.max(0, Number(loan.outstanding_balance) - amount);
        await tx.loan.update({
          where: { id: rule.loanId },
          data: { outstanding_balance: newBalance },
        });
      }
    }

    const nextDate = computeNextRunDate(date.toISOString().slice(0, 10), rule.frequency as any);
    await tx.recurringRule.update({
      where: { id: rule.id },
      data: { next_run_date: new Date(nextDate) },
    });
  });
};

export const processDueRules = async (userId: number): Promise<number> => {
  const today = todayString();
  const rules = await prisma.recurringRule.findMany({
    where: {
      userId,
      paused: false,
      next_run_date: { lte: new Date(today) },
      OR: [{ end_date: null }, { end_date: { gte: new Date(today) } }],
    },
  });

  for (const rule of rules) {
    await executeRule(userId, rule);
  }
  return rules.length;
};

export const runRuleNow = async (userId: number, publicId: string): Promise<boolean> => {
  const rule = await prisma.recurringRule.findFirst({
    where: { publicId, userId, paused: false },
  });
  if (!rule) return false;
  await executeRule(userId, rule);
  return true;
};
