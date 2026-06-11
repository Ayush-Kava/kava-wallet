import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { applyTransactionDelta, applyTransferDeltas } from '@/lib/money';
import { computeNextRunDate } from '@/lib/recurring-utils';
import {
  assertAccountOwnership,
  assertAccountsOwnership,
} from '@/services/repositories/accounts/ownership';
import type { RecurringRule, CreateRecurringRuleData } from '@/types/recurring-types';
import { toRecurringRuleType } from '@/types/recurring-types';

const todayString = (): string => new Date().toISOString().slice(0, 10);

export const listByUser = async (userId: string): Promise<RecurringRule[]> => {
  const rules = await prisma.recurringRule.findMany({
    where: { userId },
    orderBy: { next_run_date: 'asc' },
  });
  return rules.map(toRecurringRuleType);
};

export const getById = async (userId: string, id: string): Promise<RecurringRule | null> => {
  const rule = await prisma.recurringRule.findFirst({ where: { id, userId } });
  return rule ? toRecurringRuleType(rule) : null;
};

export const create = async (userId: string, data: CreateRecurringRuleData): Promise<void> => {
  if (data.account_id) await assertAccountOwnership(userId, data.account_id);
  if (data.from_account_id && data.to_account_id) {
    await assertAccountsOwnership(userId, [data.from_account_id, data.to_account_id]);
  }

  await prisma.recurringRule.create({
    data: {
      userId,
      name: data.name,
      description: data.description,
      type: data.type,
      frequency: data.frequency,
      amount: data.amount,
      accountId: data.account_id,
      fromAccountId: data.from_account_id,
      toAccountId: data.to_account_id,
      categoryId: data.category_id,
      loanId: data.loan_id,
      next_run_date: new Date(data.next_run_date),
      end_date: data.end_date ? new Date(data.end_date) : null,
      paused: data.paused ?? false,
    },
  });
};

export const update = async (
  userId: string,
  id: string,
  data: Partial<CreateRecurringRuleData>,
): Promise<boolean> => {
  if (data.account_id) await assertAccountOwnership(userId, data.account_id);
  if (data.from_account_id && data.to_account_id) {
    await assertAccountsOwnership(userId, [data.from_account_id, data.to_account_id]);
  }

  const result = await prisma.recurringRule.updateMany({
    where: { id, userId },
    data: {
      name: data.name,
      description: data.description,
      type: data.type,
      frequency: data.frequency,
      amount: data.amount,
      accountId: data.account_id,
      fromAccountId: data.from_account_id,
      toAccountId: data.to_account_id,
      categoryId: data.category_id,
      loanId: data.loan_id,
      next_run_date: data.next_run_date ? new Date(data.next_run_date) : undefined,
      end_date:
        data.end_date === undefined ? undefined : data.end_date ? new Date(data.end_date) : null,
      paused: data.paused,
    },
  });
  return result.count > 0;
};

export const remove = async (userId: string, id: string): Promise<boolean> => {
  const result = await prisma.recurringRule.deleteMany({
    where: { id, userId },
  });
  return result.count > 0;
};

export const setPaused = async (userId: string, id: string, paused: boolean): Promise<boolean> => {
  const result = await prisma.recurringRule.updateMany({
    where: { id, userId },
    data: { paused },
  });
  return result.count > 0;
};

const executeRule = async (
  userId: string,
  rule: {
    id: string;
    type: string;
    amount: any;
    accountId: string | null;
    fromAccountId: string | null;
    toAccountId: string | null;
    categoryId: string | null;
    loanId: string | null;
    name: string;
    description: string | null;
    frequency: string;
    next_run_date: Date;
  },
): Promise<void> => {
  const amount = Number(rule.amount);
  const date = rule.next_run_date;

  await prisma.$transaction(async tx => {
    if (rule.type === 'transfer') {
      if (!rule.fromAccountId || !rule.toAccountId) return;
      const transferId = randomUUID();
      await tx.transaction.create({
        data: {
          userId,
          accountId: rule.fromAccountId,
          type: 'expense',
          amount,
          description: rule.description || rule.name,
          date,
          transfer_id: transferId,
        },
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

export const processDueRules = async (userId: string): Promise<number> => {
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

export const runRuleNow = async (userId: string, id: string): Promise<boolean> => {
  const rule = await prisma.recurringRule.findFirst({
    where: { id, userId, paused: false },
  });
  if (!rule) return false;
  await executeRule(userId, rule);
  return true;
};
