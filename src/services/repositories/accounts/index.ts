import { prisma } from '@/lib/prisma';
import type { CreateAccountData, Account } from '@/types/account-types';
import { toAccountType } from '@/types/account-types';
import type { Transaction } from '@/types/transaction-types';
import { toTransactionType } from '@/types/transaction-types';

export const listByUser = async (userId: string): Promise<Account[]> => {
  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return accounts.map(toAccountType);
};

export const getById = async (userId: string, id: string): Promise<Account | null> => {
  const account = await prisma.account.findFirst({ where: { id, userId } });
  return account ? toAccountType(account) : null;
};

export const create = async (
  userId: string,
  data: CreateAccountData & {
    statement_start_date?: string | null;
    statement_end_date?: string | null;
    due_date?: string | null;
  },
): Promise<void> => {
  await prisma.account.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      balance: data.balance ?? 0,
      currency: data.currency ?? 'INR',
      color: data.color ?? '#10B981',
      icon: data.icon ?? 'wallet',
      statement_start_date: data.statement_start_date ? new Date(data.statement_start_date) : null,
      statement_end_date: data.statement_end_date ? new Date(data.statement_end_date) : null,
      due_date: data.due_date ? new Date(data.due_date) : null,
      credit_limit: data.credit_limit,
      min_due: data.min_due,
    },
  });
};

export const update = async (
  userId: string,
  id: string,
  data: Partial<CreateAccountData> & {
    statement_start_date?: string | null;
    statement_end_date?: string | null;
    due_date?: string | null;
  },
): Promise<void> => {
  await prisma.account.updateMany({
    where: { id, userId },
    data: {
      name: data.name,
      type: data.type,
      balance: data.balance,
      currency: data.currency,
      color: data.color,
      icon: data.icon,
      statement_start_date:
        data.statement_start_date === undefined
          ? undefined
          : data.statement_start_date
            ? new Date(data.statement_start_date)
            : null,
      statement_end_date:
        data.statement_end_date === undefined
          ? undefined
          : data.statement_end_date
            ? new Date(data.statement_end_date)
            : null,
      due_date:
        data.due_date === undefined ? undefined : data.due_date ? new Date(data.due_date) : null,
      credit_limit: data.credit_limit,
      min_due: data.min_due,
    },
  });
};

export const remove = async (userId: string, id: string): Promise<void> => {
  await prisma.account.deleteMany({ where: { id, userId } });
};

export const listTransactions = async (
  userId: string,
  accountId: string,
): Promise<Transaction[]> => {
  const transactions = await prisma.transaction.findMany({
    where: { accountId, userId },
    orderBy: { date: 'desc' },
  });
  return transactions.map(toTransactionType);
};
