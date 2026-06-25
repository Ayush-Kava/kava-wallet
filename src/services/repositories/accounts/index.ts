import { prisma } from '@/lib/prisma';
import { asNullablePublicId, asPublicId } from '@/lib/public-id';
import { maskAccountNumber, maskCardNumber } from '@/lib/mask-sensitive';
import { resolveBankId } from '@/lib/utils/resolve-owned-resource';
import type { Account, AccountType, CreateAccountData } from '@/types/account-types';
import type { Transaction } from '@/types/transaction-types';
import { toTransactionType, transactionInclude } from '@/types/transaction-types';
import type { AccountKind } from '@prisma/client';

const kindToType = (kind: AccountKind): AccountType => kind as AccountType;

const dateStr = (d: Date | null | undefined) => d?.toISOString().split('T')[0] ?? null;

async function loadAccountDetails(
  kind: AccountKind,
  referenceId: number,
  maskSensitive = false,
): Promise<Omit<Account, 'id' | 'type'> | null> {
  switch (kind) {
    case 'bank': {
      const row = await prisma.bankAccount.findUnique({
        where: { id: referenceId },
        include: { bank: true },
      });
      if (!row) return null;
      const accountNumber = row.accountNumber.toString();
      return {
        name: row.name,
        balance: Number(row.balance),
        currency: row.currency,
        color: row.color,
        icon: row.icon,
        bank_id: asNullablePublicId(row.bank.publicId),
        bank_name: row.bank.name,
        account_number: maskSensitive ? maskAccountNumber(accountNumber) : accountNumber,
        ifsc_code: row.ifscCode,
        created_at: row.createdAt.toISOString(),
        updated_at: row.updatedAt.toISOString(),
      };
    }
    case 'cash': {
      const row = await prisma.cashAccount.findUnique({ where: { id: referenceId } });
      if (!row) return null;
      return {
        name: row.name,
        balance: Number(row.balance),
        currency: row.currency,
        color: row.color,
        icon: row.icon,
        created_at: row.createdAt.toISOString(),
        updated_at: row.updatedAt.toISOString(),
      };
    }
    case 'wallet': {
      const row = await prisma.walletAccount.findUnique({ where: { id: referenceId } });
      if (!row) return null;
      return {
        name: row.name,
        balance: Number(row.balance),
        currency: row.currency,
        color: row.color,
        icon: row.icon,
        provider: row.provider,
        created_at: row.createdAt.toISOString(),
        updated_at: row.updatedAt.toISOString(),
      };
    }
    case 'credit_card': {
      const row = await prisma.creditCard.findUnique({
        where: { id: referenceId },
        include: { bank: true },
      });
      if (!row) return null;
      return {
        name: row.name,
        balance: Number(row.outstandingBalance),
        currency: row.currency,
        color: row.color,
        icon: row.icon,
        bank_id: asNullablePublicId(row.bank?.publicId),
        bank_name: row.bank?.name ?? null,
        card_number: maskSensitive ? maskCardNumber(row.cardNumber) : row.cardNumber,
        card_holder_name: row.cardHolderName,
        expiry_date: dateStr(row.expiryDate),
        statement_start_date: dateStr(row.statementStartDate),
        statement_end_date: dateStr(row.statementEndDate),
        due_date: dateStr(row.dueDate),
        credit_limit: Number(row.creditLimit),
        min_due: row.minDue ? Number(row.minDue) : null,
        created_at: row.createdAt.toISOString(),
        updated_at: row.updatedAt.toISOString(),
      };
    }
    default:
      return null;
  }
}

async function toAccount(
  registry: { publicId: string; kind: AccountKind; referenceId: number },
  maskSensitive = false,
): Promise<Account | null> {
  const details = await loadAccountDetails(registry.kind, registry.referenceId, maskSensitive);
  if (!details) return null;
  return {
    id: asPublicId(registry.publicId),
    type: kindToType(registry.kind),
    ...details,
  };
}

export const listByUser = async (userId: number): Promise<Account[]> => {
  const registries = await prisma.account.findMany({
    where: { userId },
    orderBy: { id: 'desc' },
  });
  const accounts = await Promise.all(registries.map(r => toAccount(r, true)));
  return accounts.filter((a): a is Account => a !== null);
};

export const getById = async (userId: number, publicId: string): Promise<Account | null> => {
  const registry = await prisma.account.findFirst({ where: { publicId, userId } });
  return registry ? toAccount(registry) : null;
};

export const create = async (userId: number, data: CreateAccountData): Promise<void> => {
  await prisma.$transaction(async tx => {
    switch (data.type) {
      case 'bank': {
        const bankId = await resolveBankId(data.bank_id);
        if (!bankId) throw new Error('Invalid bank');
        const bankAccount = await tx.bankAccount.create({
          data: {
            userId,
            bankId,
            name: data.name,
            accountNumber: BigInt(data.account_number),
            ifscCode: data.ifsc_code.toUpperCase(),
            balance: data.balance ?? 0,
            currency: data.currency ?? 'INR',
            color: data.color ?? '#10B981',
            icon: data.icon ?? 'landmark',
          },
        });
        await tx.account.create({
          data: { userId, kind: 'bank', referenceId: bankAccount.id },
        });
        break;
      }
      case 'cash': {
        const cashAccount = await tx.cashAccount.create({
          data: {
            userId,
            name: data.name,
            balance: data.balance ?? 0,
            currency: data.currency ?? 'INR',
            color: data.color ?? '#10B981',
            icon: data.icon ?? 'banknote',
          },
        });
        await tx.account.create({
          data: { userId, kind: 'cash', referenceId: cashAccount.id },
        });
        break;
      }
      case 'wallet': {
        const walletAccount = await tx.walletAccount.create({
          data: {
            userId,
            name: data.name,
            provider: data.provider,
            balance: data.balance ?? 0,
            currency: data.currency ?? 'INR',
            color: data.color ?? '#5F259F',
            icon: data.icon ?? 'smartphone',
          },
        });
        await tx.account.create({
          data: { userId, kind: 'wallet', referenceId: walletAccount.id },
        });
        break;
      }
      case 'credit_card': {
        const bankId = data.bank_id ? await resolveBankId(data.bank_id) : null;
        const creditCard = await tx.creditCard.create({
          data: {
            userId,
            bankId,
            name: data.name,
            cardNumber: data.card_number,
            cardHolderName: data.card_holder_name,
            expiryDate: new Date(data.expiry_date),
            creditLimit: data.credit_limit,
            outstandingBalance: data.balance ?? 0,
            minDue: data.min_due,
            statementStartDate: new Date(data.statement_start_date),
            statementEndDate: new Date(data.statement_end_date),
            dueDate: new Date(data.due_date),
            currency: data.currency ?? 'INR',
            color: data.color ?? '#1A1F71',
            icon: data.icon ?? 'credit-card',
          },
        });
        await tx.account.create({
          data: { userId, kind: 'credit_card', referenceId: creditCard.id },
        });
        break;
      }
    }
  });
};

export const update = async (
  userId: number,
  publicId: string,
  data: Partial<CreateAccountData>,
): Promise<void> => {
  const registry = await prisma.account.findFirst({ where: { publicId, userId } });
  if (!registry) return;

  const refId = registry.referenceId;

  switch (registry.kind) {
    case 'bank':
      if (data.type && data.type !== 'bank') return;
      await prisma.bankAccount.updateMany({
        where: { id: refId, userId },
        data: {
          name: data.name,
          bankId:
            data.type === 'bank' && data.bank_id
              ? ((await resolveBankId(data.bank_id)) ?? undefined)
              : undefined,
          accountNumber:
            data.type === 'bank' && data.account_number
              ? BigInt(data.account_number)
              : undefined,
          ifscCode:
            data.type === 'bank' && data.ifsc_code ? data.ifsc_code.toUpperCase() : undefined,
          balance: data.balance,
          currency: data.currency,
          color: data.color,
          icon: data.icon,
        },
      });
      break;
    case 'cash':
      await prisma.cashAccount.updateMany({
        where: { id: refId, userId },
        data: {
          name: data.name,
          balance: data.balance,
          currency: data.currency,
          color: data.color,
          icon: data.icon,
        },
      });
      break;
    case 'wallet':
      await prisma.walletAccount.updateMany({
        where: { id: refId, userId },
        data: {
          name: data.name,
          provider: data.type === 'wallet' ? data.provider : undefined,
          balance: data.balance,
          currency: data.currency,
          color: data.color,
          icon: data.icon,
        },
      });
      break;
    case 'credit_card':
      if (data.type && data.type !== 'credit_card') return;
      await prisma.creditCard.updateMany({
        where: { id: refId, userId },
        data: {
          name: data.name,
          bankId:
            data.type === 'credit_card' && data.bank_id
              ? ((await resolveBankId(data.bank_id)) ?? undefined)
              : undefined,
          cardNumber: data.type === 'credit_card' ? data.card_number : undefined,
          cardHolderName: data.type === 'credit_card' ? data.card_holder_name : undefined,
          expiryDate:
            data.type === 'credit_card' && data.expiry_date
              ? new Date(data.expiry_date)
              : undefined,
          creditLimit: data.type === 'credit_card' ? data.credit_limit : undefined,
          outstandingBalance: data.balance,
          minDue: data.type === 'credit_card' ? data.min_due : undefined,
          statementStartDate:
            data.type === 'credit_card' && data.statement_start_date
              ? new Date(data.statement_start_date)
              : undefined,
          statementEndDate:
            data.type === 'credit_card' && data.statement_end_date
              ? new Date(data.statement_end_date)
              : undefined,
          dueDate:
            data.type === 'credit_card' && data.due_date ? new Date(data.due_date) : undefined,
          currency: data.currency,
          color: data.color,
          icon: data.icon,
        },
      });
      break;
  }
};

export const remove = async (userId: number, publicId: string): Promise<void> => {
  const registry = await prisma.account.findFirst({ where: { publicId, userId } });
  if (!registry) return;

  await prisma.$transaction(async tx => {
    await tx.account.delete({ where: { id: registry.id } });
    switch (registry.kind) {
      case 'bank':
        await tx.bankAccount.deleteMany({ where: { id: registry.referenceId, userId } });
        break;
      case 'cash':
        await tx.cashAccount.deleteMany({ where: { id: registry.referenceId, userId } });
        break;
      case 'wallet':
        await tx.walletAccount.deleteMany({ where: { id: registry.referenceId, userId } });
        break;
      case 'credit_card':
        await tx.creditCard.deleteMany({ where: { id: registry.referenceId, userId } });
        break;
    }
  });
};

export const listTransactions = async (
  userId: number,
  accountPublicId: string,
): Promise<Transaction[]> => {
  const account = await prisma.account.findFirst({
    where: { publicId: accountPublicId, userId },
    select: { id: true },
  });
  if (!account) return [];

  const transactions = await prisma.transaction.findMany({
    where: { accountId: account.id, userId },
    include: transactionInclude,
    orderBy: { date: 'desc' },
  });
  const labels = await getAccountSummaryByPublicIds(
    userId,
    transactions.map(tx => tx.account.publicId),
  );
  return transactions.map(tx =>
    toTransactionType(tx, labels.get(tx.account.publicId)),
  );
};

export const getAccountSummaryByPublicIds = async (
  userId: number,
  publicIds: string[],
): Promise<Map<string, { name: string; type: string; balance: number }>> => {
  const unique = [...new Set(publicIds)];
  const map = new Map<string, { name: string; type: string; balance: number }>();
  if (!unique.length) return map;

  const registries = await prisma.account.findMany({
    where: { userId, publicId: { in: unique } },
  });

  await Promise.all(
    registries.map(async reg => {
      const details = await loadAccountDetails(reg.kind, reg.referenceId);
      if (details) {
        map.set(reg.publicId, { name: details.name, type: reg.kind, balance: details.balance });
      }
    }),
  );

  return map;
};
