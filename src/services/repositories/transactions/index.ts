import { randomUUID } from 'crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  applyTransactionDelta,
  applyTransferDeltas,
  reverseTransactionDelta,
  reverseTransferDeltas,
} from '@/lib/money';
import {
  assertAccountOwnership,
  assertAccountsOwnership,
} from '@/services/repositories/accounts/ownership';
import type {
  CreateTransactionData,
  CreateTransferData,
  UpdateTransferData,
  PaginatedTransactionsResult,
  TransactionDetail,
  TransactionFilters,
} from '@/types/transaction-types';
import { toTransactionType, mapTransactionFilters } from '@/types/transaction-types';

export const list = async (
  userId: string,
  page: number,
  limit: number,
  filters?: TransactionFilters,
): Promise<PaginatedTransactionsResult> => {
  const mapped = mapTransactionFilters(filters);
  const where: Prisma.TransactionWhereInput = {
    userId,
    ...(mapped.type ? { type: mapped.type } : {}),
    ...(mapped.accountId ? { accountId: mapped.accountId } : {}),
    ...(mapped.categoryId ? { categoryId: mapped.categoryId } : {}),
    ...(filters?.search ? { description: { contains: filters.search, mode: 'insensitive' } } : {}),
  };

  const [rawData, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    data: rawData.map(toTransactionType),
    totalCount: total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const createTransaction = async (
  userId: string,
  data: CreateTransactionData,
): Promise<void> => {
  const { account_id, category_id, transfer_id, ...rest } = data;
  await assertAccountOwnership(userId, account_id);

  await prisma.$transaction(async tx => {
    await tx.transaction.create({
      data: {
        userId,
        accountId: account_id,
        categoryId: category_id,
        transfer_id,
        ...rest,
        date: new Date(rest.date),
      },
    });
    await applyTransactionDelta(tx, account_id, rest.type, rest.amount);
  });
};

export const getDetail = async (userId: string, id: string): Promise<TransactionDetail | null> => {
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
  });
  if (!transaction) return null;

  const linkedTransactions = transaction.transfer_id
    ? await prisma.transaction.findMany({
        where: { transfer_id: transaction.transfer_id, userId },
        orderBy: { date: 'desc' },
      })
    : [];

  return {
    transaction: toTransactionType(transaction),
    linkedTransactions: linkedTransactions.map(toTransactionType),
  };
};

export const updateTransaction = async (
  userId: string,
  id: string,
  data: Partial<CreateTransactionData>,
): Promise<boolean> => {
  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
  });
  if (!existing || existing.transfer_id) return false;

  const accountId = data.account_id ?? existing.accountId;
  const type = (data.type ?? existing.type) as 'income' | 'expense';
  const amount = data.amount ?? Number(existing.amount);

  await assertAccountOwnership(userId, accountId);
  if (data.account_id && data.account_id !== existing.accountId) {
    await assertAccountOwnership(userId, existing.accountId);
  }

  await prisma.$transaction(async tx => {
    await reverseTransactionDelta(tx, existing.accountId, existing.type, existing.amount);
    await tx.transaction.update({
      where: { id },
      data: {
        accountId: data.account_id,
        categoryId: data.category_id,
        type: data.type,
        amount: data.amount,
        description: data.description,
        date: data.date ? new Date(data.date) : undefined,
      },
    });
    await applyTransactionDelta(tx, accountId, type, amount);
  });

  return true;
};

export const deleteTransaction = async (
  userId: string,
  id: string,
): Promise<{ deletedTransfer: boolean } | null> => {
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
  });
  if (!transaction) return null;

  const transferId = transaction.transfer_id;

  await prisma.$transaction(async tx => {
    if (transferId) {
      const pair = await tx.transaction.findMany({
        where: { transfer_id: transferId, userId },
      });
      const expense = pair.find(t => t.type === 'expense');
      const income = pair.find(t => t.type === 'income');
      if (expense && income) {
        await reverseTransferDeltas(tx, expense.accountId, income.accountId, expense.amount);
      }
      await tx.transaction.deleteMany({
        where: { transfer_id: transferId, userId },
      });
    } else {
      await reverseTransactionDelta(
        tx,
        transaction.accountId,
        transaction.type,
        transaction.amount,
      );
      await tx.transaction.delete({ where: { id: transaction.id } });
    }
  });

  return { deletedTransfer: !!transferId };
};

export const duplicateTransaction = async (
  userId: string,
  id: string,
): Promise<{ duplicatedTransfer: boolean } | null> => {
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
  });
  if (!transaction) return null;

  if (transaction.transfer_id) {
    const pair = await prisma.transaction.findMany({
      where: { transfer_id: transaction.transfer_id, userId },
    });
    const expense = pair.find(t => t.type === 'expense');
    const income = pair.find(t => t.type === 'income');
    if (!expense || !income) return null;

    const newTransferId = randomUUID();
    await prisma.$transaction(async tx => {
      await tx.transaction.create({
        data: {
          userId,
          accountId: expense.accountId,
          categoryId: expense.categoryId,
          type: 'expense',
          amount: expense.amount,
          description: expense.description,
          date: expense.date,
          transfer_id: newTransferId,
        },
      });
      await tx.transaction.create({
        data: {
          userId,
          accountId: income.accountId,
          categoryId: income.categoryId,
          type: 'income',
          amount: income.amount,
          description: income.description,
          date: income.date,
          transfer_id: newTransferId,
        },
      });
      await applyTransferDeltas(tx, expense.accountId, income.accountId, expense.amount);
    });
    return { duplicatedTransfer: true };
  }

  await prisma.$transaction(async tx => {
    await tx.transaction.create({
      data: {
        userId,
        accountId: transaction.accountId,
        categoryId: transaction.categoryId,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date,
      },
    });
    await applyTransactionDelta(tx, transaction.accountId, transaction.type, transaction.amount);
  });

  return { duplicatedTransfer: false };
};

export const createTransfer = async (userId: string, data: CreateTransferData): Promise<void> => {
  const { from_account_id, to_account_id, amount, description, date } = data;
  await assertAccountsOwnership(userId, [from_account_id, to_account_id]);
  const transferId = randomUUID();

  await prisma.$transaction(async tx => {
    await tx.transaction.create({
      data: {
        userId,
        accountId: from_account_id,
        type: 'expense',
        amount,
        description,
        date: new Date(date),
        transfer_id: transferId,
      },
    });
    await tx.transaction.create({
      data: {
        userId,
        accountId: to_account_id,
        type: 'income',
        amount,
        description,
        date: new Date(date),
        transfer_id: transferId,
      },
    });
    await applyTransferDeltas(tx, from_account_id, to_account_id, amount);
  });
};

export const updateTransfer = async (
  userId: string,
  data: UpdateTransferData,
): Promise<boolean> => {
  const { transfer_id, from_account_id, to_account_id, amount, description, date } = data;
  await assertAccountsOwnership(userId, [from_account_id, to_account_id]);

  const pair = await prisma.transaction.findMany({
    where: { transfer_id, userId },
  });
  if (pair.length === 0) return false;

  const oldExpense = pair.find(t => t.type === 'expense');
  const oldIncome = pair.find(t => t.type === 'income');
  if (!oldExpense || !oldIncome) return false;

  await prisma.$transaction(async tx => {
    await reverseTransferDeltas(tx, oldExpense.accountId, oldIncome.accountId, oldExpense.amount);
    await Promise.all(
      pair.map(t =>
        tx.transaction.update({
          where: { id: t.id },
          data: {
            accountId: t.type === 'expense' ? from_account_id : to_account_id,
            amount,
            description,
            date: date ? new Date(date) : t.date,
          },
        }),
      ),
    );
    await applyTransferDeltas(tx, from_account_id, to_account_id, amount);
  });

  return true;
};

export const getTransferPairs = async (
  userId: string,
  transferIds?: string[],
): Promise<PaginatedTransactionsResult['data']> => {
  const transfers = await prisma.transaction.findMany({
    where: {
      userId,
      transfer_id: transferIds?.length ? { in: transferIds } : { not: null },
    },
    orderBy: { date: 'desc' },
  });
  return transfers.map(toTransactionType);
};
