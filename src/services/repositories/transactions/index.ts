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
import { getAccountSummaryByPublicIds } from '@/services/repositories/accounts';
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
  transactionInclude,
} from '@/types/transaction-types';
import type { Prisma } from '@prisma/client';

const buildTransferPublicIdMap = async (
  userId: number,
  rows: { transfer_id: number | null }[],
) => {
  const internalIds = [...new Set(rows.map(r => r.transfer_id).filter((id): id is number => id != null))];
  if (!internalIds.length) return new Map<number, string>();

  const txs = await prisma.transaction.findMany({
    where: { userId, id: { in: internalIds } },
    select: { id: true, publicId: true },
  });
  return new Map(txs.map(tx => [tx.id, tx.publicId]));
};

const mapRows = async (
  userId: number,
  rows: Parameters<typeof toTransactionType>[0][],
) => {
  const transferMap = await buildTransferPublicIdMap(userId, rows);
  const labels = await getAccountSummaryByPublicIds(
    userId,
    rows.map(tx => tx.account?.publicId ?? '').filter(Boolean),
  );
  return rows.map(tx =>
    toTransactionType(
      tx,
      tx.account?.publicId ? labels.get(tx.account.publicId) : undefined,
      tx.transfer_id ? transferMap.get(tx.transfer_id) ?? null : null,
    ),
  );
};

export const list = async (
  userId: number,
  page: number,
  limit: number,
  filters?: TransactionFilters,
): Promise<PaginatedTransactionsResult> => {
  const mapped = mapTransactionFilters(filters);
  const where: Prisma.TransactionWhereInput = {
    userId,
    ...(mapped.type ? { type: mapped.type } : {}),
    ...(mapped.accountPublicId
      ? { account: { publicId: mapped.accountPublicId } }
      : {}),
    ...(mapped.categoryPublicId
      ? { category: { publicId: mapped.categoryPublicId } }
      : {}),
    ...(filters?.search ? { description: { contains: filters.search, mode: 'insensitive' } } : {}),
  };

  const [rawData, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: transactionInclude,
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    data: await mapRows(userId, rawData),
    totalCount: total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const createTransaction = async (
  userId: number,
  data: CreateTransactionData,
): Promise<void> => {
  const { account_id, category_id, ...rest } = data;
  const accountId = await assertAccountOwnership(userId, account_id);

  let categoryId: number | undefined;
  if (category_id) {
    const category = await prisma.category.findFirst({
      where: {
        publicId: category_id,
        OR: [{ userId }, { userId: null, is_default: true }],
      },
      select: { id: true },
    });
    if (!category) throw new Error('Invalid category');
    categoryId = category.id;
  }

  await prisma.$transaction(async tx => {
    await tx.transaction.create({
      data: {
        userId,
        accountId,
        categoryId,
        ...rest,
        date: new Date(rest.date),
      },
    });
    await applyTransactionDelta(tx, accountId, rest.type, rest.amount);
  });
};

export const getDetail = async (
  userId: number,
  publicId: string,
): Promise<TransactionDetail | null> => {
  const transaction = await prisma.transaction.findFirst({
    where: { publicId, userId },
    include: transactionInclude,
  });
  if (!transaction) return null;

  const linkedTransactions = transaction.transfer_id
    ? await prisma.transaction.findMany({
        where: { transfer_id: transaction.transfer_id, userId },
        include: transactionInclude,
        orderBy: { date: 'desc' },
      })
    : [];

  const allRows = [transaction, ...linkedTransactions];
  const mapped = await mapRows(userId, allRows);
  return {
    transaction: mapped[0],
    linkedTransactions: mapped.slice(1),
  };
};

export const updateTransaction = async (
  userId: number,
  publicId: string,
  data: Partial<CreateTransactionData>,
): Promise<boolean> => {
  const existing = await prisma.transaction.findFirst({
    where: { publicId, userId },
  });
  if (!existing || existing.transfer_id) return false;

  const accountId = data.account_id
    ? await assertAccountOwnership(userId, data.account_id)
    : existing.accountId;
  const type = (data.type ?? existing.type) as 'income' | 'expense';
  const amount = data.amount ?? Number(existing.amount);

  if (data.account_id) {
    const oldAccount = await prisma.account.findFirst({
      where: { id: existing.accountId, userId },
      select: { publicId: true },
    });
    if (oldAccount && data.account_id !== oldAccount.publicId) {
      await assertAccountOwnership(userId, oldAccount.publicId);
    }
  }

  let categoryId: number | null | undefined;
  if (data.category_id !== undefined) {
    if (data.category_id) {
      const category = await prisma.category.findFirst({
        where: {
          publicId: data.category_id,
          OR: [{ userId }, { userId: null, is_default: true }],
        },
        select: { id: true },
      });
      categoryId = category?.id ?? null;
      if (data.category_id && !categoryId) throw new Error('Invalid category');
    } else {
      categoryId = null;
    }
  }

  await prisma.$transaction(async tx => {
    await reverseTransactionDelta(tx, existing.accountId, existing.type, existing.amount);
    await tx.transaction.update({
      where: { id: existing.id },
      data: {
        accountId: data.account_id ? accountId : undefined,
        categoryId,
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
  userId: number,
  publicId: string,
): Promise<{ deletedTransfer: boolean } | null> => {
  const transaction = await prisma.transaction.findFirst({
    where: { publicId, userId },
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
  userId: number,
  publicId: string,
): Promise<{ duplicatedTransfer: boolean } | null> => {
  const transaction = await prisma.transaction.findFirst({
    where: { publicId, userId },
  });
  if (!transaction) return null;

  if (transaction.transfer_id) {
    const pair = await prisma.transaction.findMany({
      where: { transfer_id: transaction.transfer_id, userId },
    });
    const expense = pair.find(t => t.type === 'expense');
    const income = pair.find(t => t.type === 'income');
    if (!expense || !income) return null;

    await prisma.$transaction(async tx => {
      const newExpense = await tx.transaction.create({
        data: {
          userId,
          accountId: expense.accountId,
          categoryId: expense.categoryId,
          type: 'expense',
          amount: expense.amount,
          description: expense.description,
          date: expense.date,
        },
      });
      const transferId = newExpense.id;
      await tx.transaction.update({
        where: { id: transferId },
        data: { transfer_id: transferId },
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
          transfer_id: transferId,
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

export const createTransfer = async (userId: number, data: CreateTransferData): Promise<void> => {
  const { from_account_id, to_account_id, amount, description, date } = data;
  const [fromAccountId, toAccountId] = await assertAccountsOwnership(userId, [
    from_account_id,
    to_account_id,
  ]);

  await prisma.$transaction(async tx => {
    const expense = await tx.transaction.create({
      data: {
        userId,
        accountId: fromAccountId,
        type: 'expense',
        amount,
        description,
        date: new Date(date),
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
        accountId: toAccountId,
        type: 'income',
        amount,
        description,
        date: new Date(date),
        transfer_id: transferId,
      },
    });
    await applyTransferDeltas(tx, fromAccountId, toAccountId, amount);
  });
};

export const updateTransfer = async (
  userId: number,
  data: UpdateTransferData,
): Promise<boolean> => {
  const { transfer_id, from_account_id, to_account_id, amount, description, date } = data;
  const [fromAccountId, toAccountId] = await assertAccountsOwnership(userId, [
    from_account_id,
    to_account_id,
  ]);

  const anchor = await prisma.transaction.findFirst({
    where: { publicId: transfer_id, userId },
    select: { transfer_id: true },
  });
  if (!anchor?.transfer_id) return false;

  const pair = await prisma.transaction.findMany({
    where: { transfer_id: anchor.transfer_id, userId },
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
            accountId: t.type === 'expense' ? fromAccountId : toAccountId,
            amount,
            description,
            date: date ? new Date(date) : t.date,
          },
        }),
      ),
    );
    await applyTransferDeltas(tx, fromAccountId, toAccountId, amount);
  });

  return true;
};

export const getTransferPairs = async (
  userId: number,
  transferPublicIds?: string[],
): Promise<PaginatedTransactionsResult['data']> => {
  let transferInternalIds: number[] | undefined;
  if (transferPublicIds?.length) {
    const anchors = await prisma.transaction.findMany({
      where: { userId, publicId: { in: transferPublicIds } },
      select: { transfer_id: true },
    });
    transferInternalIds = anchors
      .map(a => a.transfer_id)
      .filter((id): id is number => id != null);
  }

  const transfers = await prisma.transaction.findMany({
    where: {
      userId,
      transfer_id: transferInternalIds?.length
        ? { in: transferInternalIds }
        : { not: null },
    },
    include: transactionInclude,
    orderBy: { date: 'desc' },
  });
  return mapRows(userId, transfers);
};
