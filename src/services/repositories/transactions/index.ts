import { randomUUID } from 'crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type {
  CreateTransactionData,
  CreateTransferData,
  UpdateTransferData,
  PaginatedTransactionsResult,
  TransactionDetail,
  TransactionFilters,
} from '@/types/transaction-types';
import {
  toTransactionType,
  mapTransactionFilters,
} from '@/types/transaction-types';

export const list = async (
  userId: string,
  page: number,
  limit: number,
  filters?: TransactionFilters,
): Promise<PaginatedTransactionsResult> => {
  const where = {
    userId,
    ...mapTransactionFilters(filters),
  } as const;

  const [rawData, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data: rawData.map(toTransactionType),
    totalCount: total,
    totalPages,
  };
};

export const createTransaction = async (
  userId: string,
  data: CreateTransactionData,
): Promise<void> => {
  const { account_id, category_id, transfer_id, ...rest } = data;
  await prisma.transaction.create({
    data: {
      userId,
      accountId: account_id,
      categoryId: category_id,
      transfer_id,
      ...rest,
      date: new Date(rest.date),
    },
  });
};

export const getDetail = async (
  userId: string,
  id: string,
): Promise<TransactionDetail | null> => {
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
  });
  if (!transaction) return null;

  const linkedTransactions = await prisma.transaction.findMany({
    where: { transfer_id: transaction.transfer_id, userId },
    orderBy: { date: 'desc' },
  });

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
  const { account_id, category_id, ...rest } = data;
  const result = await prisma.transaction.updateMany({
    where: { id, userId },
    data: {
      accountId: account_id,
      categoryId: category_id,
      ...rest,
      date: rest.date ? new Date(rest.date) : undefined,
    },
  });

  return result.count > 0;
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

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (transferId) {
      await tx.transaction.deleteMany({
        where: { transfer_id: transferId, userId },
      });
    } else {
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

  const transferId = transaction.transfer_id;

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const clone = await tx.transaction.create({
      data: {
        userId,
        accountId: transaction.accountId,
        categoryId: transaction.categoryId,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date,
        transfer_id: transferId ?? undefined,
      },
    });

    if (transferId) {
      const linked = await tx.transaction.findMany({
        where: { transfer_id: transferId, userId, NOT: { id: transaction.id } },
      });

      for (const t of linked) {
        await tx.transaction.create({
          data: {
            userId,
            accountId: t.accountId,
            categoryId: t.categoryId,
            type: t.type,
            amount: t.amount,
            description: t.description,
            date: t.date,
            transfer_id: clone.transfer_id,
          },
        });
      }
    }
  });

  return { duplicatedTransfer: !!transferId };
};

export const createTransfer = async (
  userId: string,
  data: CreateTransferData,
): Promise<void> => {
  const { from_account_id, to_account_id, amount, description, date } = data;
  const transferId = randomUUID();

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
  });
};

export const updateTransfer = async (
  userId: string,
  data: UpdateTransferData,
): Promise<boolean> => {
  const {
    transfer_id,
    from_account_id,
    to_account_id,
    amount,
    description,
    date,
  } = data;
  const transferTransactions = await prisma.transaction.findMany({
    where: { transfer_id, userId },
  });
  type TransferTransaction = (typeof transferTransactions)[number];

  if (transferTransactions.length === 0) return false;

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await Promise.all(
      transferTransactions.map((transaction: TransferTransaction) => {
        const isOutgoing = transaction.type === 'expense';
        return tx.transaction.update({
          where: { id: transaction.id },
          data: {
            accountId: isOutgoing ? from_account_id : to_account_id,
            amount,
            description,
            date: date ? new Date(date) : transaction.date,
          },
        });
      }),
    );
  });

  return true;
};

export const getTransferPairs = async (
  userId: string,
  transferIds?: string[],
): Promise<PaginatedTransactionsResult['data']> => {
  const where = {
    userId,
    transfer_id: transferIds?.length ? { in: transferIds } : { not: null },
  } as const;

  const transfers = await prisma.transaction.findMany({
    where,
    orderBy: { date: 'desc' },
  });

  return transfers.map(toTransactionType);
};
