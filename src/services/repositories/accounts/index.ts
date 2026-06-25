import { prisma } from '@/lib/prisma';
import { asNullablePublicId, asPublicId } from '@/lib/public-id';
import { isMaskedSensitiveValue, maskAccountNumber, maskCardNumber } from '@/lib/mask-sensitive';
import { resolveActiveBankId } from '@/lib/utils/resolve-owned-resource';
import type { CreateAccountInput } from '@/lib/validation/account';
import { updateAccountSchemaByKind } from '@/lib/validation/account';
import { parseBody, stripImmutableAccountFields } from '@/lib/validation/common';
import type { Account, AccountType } from '@/types/account-types';
import type { Transaction } from '@/types/transaction-types';
import { toTransactionType, transactionInclude } from '@/types/transaction-types';
import type { AccountKind, BankAccount, CashAccount, CreditCard, WalletAccount } from '@prisma/client';

const ACTIVE_ACCOUNT = { deletedAt: null } as const;

const kindToType = (kind: AccountKind): AccountType => kind as AccountType;

const dateStr = (d: Date | null | undefined) => d?.toISOString().split('T')[0] ?? null;

type RegistryRow = {
  publicId: string;
  kind: AccountKind;
  referenceId: number;
};

type AccountDetails = Omit<Account, 'id' | 'type'>;

const mapBankRow = (
  row: BankAccount & { bank: { publicId: string; name: string } },
  maskSensitive: boolean,
): AccountDetails => {
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
};

const mapCashRow = (row: CashAccount, _maskSensitive: boolean): AccountDetails => ({
  name: row.name,
  balance: Number(row.balance),
  currency: row.currency,
  color: row.color,
  icon: row.icon,
  created_at: row.createdAt.toISOString(),
  updated_at: row.updatedAt.toISOString(),
});

const mapWalletRow = (row: WalletAccount, _maskSensitive: boolean): AccountDetails => ({
  name: row.name,
  balance: Number(row.balance),
  currency: row.currency,
  color: row.color,
  icon: row.icon,
  provider: row.provider,
  created_at: row.createdAt.toISOString(),
  updated_at: row.updatedAt.toISOString(),
});

const mapCreditCardRow = (
  row: CreditCard & { bank: { publicId: string; name: string } | null },
  maskSensitive: boolean,
): AccountDetails => ({
  name: row.name,
  balance: Number(row.outstandingBalance),
  currency: row.currency,
  color: row.color,
  icon: row.icon,
  bank_id: row.bank ? asNullablePublicId(row.bank.publicId) : null,
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
});

async function batchLoadDetails(
  registries: RegistryRow[],
  maskSensitive: boolean,
): Promise<Map<number, AccountDetails>> {
  const result = new Map<number, AccountDetails>();
  if (!registries.length) return result;

  const idsByKind = {
    bank: [] as number[],
    cash: [] as number[],
    wallet: [] as number[],
    credit_card: [] as number[],
  };

  for (const reg of registries) {
    idsByKind[reg.kind].push(reg.referenceId);
  }

  const [bankRows, cashRows, walletRows, cardRows] = await Promise.all([
    idsByKind.bank.length
      ? prisma.bankAccount.findMany({
          where: { id: { in: idsByKind.bank } },
          include: { bank: true },
        })
      : Promise.resolve([]),
    idsByKind.cash.length
      ? prisma.cashAccount.findMany({ where: { id: { in: idsByKind.cash } } })
      : Promise.resolve([]),
    idsByKind.wallet.length
      ? prisma.walletAccount.findMany({ where: { id: { in: idsByKind.wallet } } })
      : Promise.resolve([]),
    idsByKind.credit_card.length
      ? prisma.creditCard.findMany({
          where: { id: { in: idsByKind.credit_card } },
          include: { bank: true },
        })
      : Promise.resolve([]),
  ]);

  for (const row of bankRows) result.set(row.id, mapBankRow(row, maskSensitive));
  for (const row of cashRows) result.set(row.id, mapCashRow(row, maskSensitive));
  for (const row of walletRows) result.set(row.id, mapWalletRow(row, maskSensitive));
  for (const row of cardRows) result.set(row.id, mapCreditCardRow(row, maskSensitive));

  return result;
}

function registryToAccount(
  registry: RegistryRow,
  details: AccountDetails | undefined,
): Account | null {
  if (!details) return null;
  return {
    id: asPublicId(registry.publicId),
    type: kindToType(registry.kind),
    ...details,
  };
}

export const listByUser = async (userId: number): Promise<Account[]> => {
  const registries = await prisma.account.findMany({
    where: { userId, ...ACTIVE_ACCOUNT },
    orderBy: { id: 'desc' },
    select: { publicId: true, kind: true, referenceId: true },
  });

  const detailsMap = await batchLoadDetails(registries, true);
  return registries
    .map(reg => registryToAccount(reg, detailsMap.get(reg.referenceId)))
    .filter((a): a is Account => a !== null);
};

export const getById = async (
  userId: number,
  publicId: string,
  options?: { revealSensitive?: boolean },
): Promise<Account | null> => {
  const registry = await prisma.account.findFirst({
    where: { publicId, userId, ...ACTIVE_ACCOUNT },
    select: { publicId: true, kind: true, referenceId: true },
  });
  if (!registry) return null;

  const detailsMap = await batchLoadDetails([registry], !options?.revealSensitive);
  return registryToAccount(registry, detailsMap.get(registry.referenceId));
};

export const create = async (userId: number, data: CreateAccountInput): Promise<void> => {
  await prisma.$transaction(async tx => {
    switch (data.type) {
      case 'bank': {
        const bankId = await resolveActiveBankId(data.bank_id);
        if (!bankId) throw new Error('Invalid bank');
        const bankAccount = await tx.bankAccount.create({
          data: {
            userId,
            bankId,
            name: data.name,
            accountNumber: BigInt(data.account_number),
            ifscCode: data.ifsc_code,
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
        const bankId = data.bank_id ? await resolveActiveBankId(data.bank_id) : null;
        if (data.bank_id && !bankId) throw new Error('Invalid bank');
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

type UpdateAccountInput = Partial<{
  name: string;
  currency: string;
  color: string;
  icon: string;
  bank_id: string | null;
  account_number: string;
  ifsc_code: string;
  provider: string;
  card_number: string;
  card_holder_name: string | null;
  expiry_date: string;
  statement_start_date: string;
  statement_end_date: string;
  due_date: string;
  credit_limit: number;
  min_due: number | null;
}>;

export const update = async (
  userId: number,
  publicId: string,
  data: UpdateAccountInput,
): Promise<boolean> => {
  const registry = await prisma.account.findFirst({
    where: { publicId, userId, ...ACTIVE_ACCOUNT },
  });
  if (!registry) return false;

  await applyAccountUpdate(userId, registry, data);
  return true;
};

/** Validates request body by account kind and applies the update. */
export const updateFromRequestBody = async (
  userId: number,
  publicId: string,
  rawBody: unknown,
): Promise<boolean> => {
  const registry = await prisma.account.findFirst({
    where: { publicId, userId, ...ACTIVE_ACCOUNT },
    select: { id: true, kind: true, referenceId: true },
  });
  if (!registry) return false;

  const body = stripImmutableAccountFields(rawBody);
  const data = parseBody(updateAccountSchemaByKind[registry.kind], body);
  await applyAccountUpdate(userId, registry, data);
  return true;
};

const applyAccountUpdate = async (
  userId: number,
  registry: { kind: AccountKind; referenceId: number },
  data: UpdateAccountInput,
): Promise<void> => {
  const refId = registry.referenceId;

  switch (registry.kind) {
    case 'bank': {
      let bankId: number | undefined;
      if (data.bank_id) {
        bankId = (await resolveActiveBankId(data.bank_id)) ?? undefined;
        if (!bankId) throw new Error('Invalid bank');
      }
      const accountNumber =
        data.account_number && !isMaskedSensitiveValue(data.account_number)
          ? BigInt(data.account_number)
          : undefined;

      await prisma.bankAccount.updateMany({
        where: { id: refId, userId },
        data: {
          name: data.name,
          bankId,
          accountNumber,
          ifscCode: data.ifsc_code,
          currency: data.currency,
          color: data.color,
          icon: data.icon,
        },
      });
      break;
    }
    case 'cash':
      await prisma.cashAccount.updateMany({
        where: { id: refId, userId },
        data: {
          name: data.name,
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
          provider: data.provider,
          currency: data.currency,
          color: data.color,
          icon: data.icon,
        },
      });
      break;
    case 'credit_card': {
      let bankId: number | null | undefined;
      if (data.bank_id !== undefined) {
        if (data.bank_id) {
          bankId = (await resolveActiveBankId(data.bank_id)) ?? null;
          if (!bankId) throw new Error('Invalid bank');
        } else {
          bankId = null;
        }
      }
      const cardNumber =
        data.card_number && !isMaskedSensitiveValue(data.card_number)
          ? data.card_number
          : undefined;

      await prisma.creditCard.updateMany({
        where: { id: refId, userId },
        data: {
          name: data.name,
          bankId,
          cardNumber,
          cardHolderName: data.card_holder_name,
          expiryDate: data.expiry_date ? new Date(data.expiry_date) : undefined,
          creditLimit: data.credit_limit,
          minDue: data.min_due,
          statementStartDate: data.statement_start_date
            ? new Date(data.statement_start_date)
            : undefined,
          statementEndDate: data.statement_end_date
            ? new Date(data.statement_end_date)
            : undefined,
          dueDate: data.due_date ? new Date(data.due_date) : undefined,
          currency: data.currency,
          color: data.color,
          icon: data.icon,
        },
      });
      break;
    }
  }
};

export const remove = async (userId: number, publicId: string): Promise<void> => {
  const registry = await prisma.account.findFirst({
    where: { publicId, userId, ...ACTIVE_ACCOUNT },
    select: { id: true },
  });
  if (!registry) return;

  const txCount = await prisma.transaction.count({
    where: { accountId: registry.id, userId },
  });
  if (txCount > 0) {
    throw new Error('Account has transactions and cannot be deleted');
  }

  await prisma.account.update({
    where: { id: registry.id },
    data: { deletedAt: new Date() },
  });
};

export const listTransactions = async (
  userId: number,
  accountPublicId: string,
): Promise<Transaction[]> => {
  const account = await prisma.account.findFirst({
    where: { publicId: accountPublicId, userId, ...ACTIVE_ACCOUNT },
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
  return transactions.map(tx => toTransactionType(tx, labels.get(tx.account.publicId)));
};

export const getAccountSummaryByPublicIds = async (
  userId: number,
  publicIds: string[],
): Promise<Map<string, { name: string; type: string; balance: number }>> => {
  const unique = [...new Set(publicIds)];
  const map = new Map<string, { name: string; type: string; balance: number }>();
  if (!unique.length) return map;

  const registries = await prisma.account.findMany({
    where: { userId, publicId: { in: unique }, ...ACTIVE_ACCOUNT },
    select: { publicId: true, kind: true, referenceId: true },
  });

  const detailsMap = await batchLoadDetails(registries, true);
  for (const reg of registries) {
    const details = detailsMap.get(reg.referenceId);
    if (details) {
      map.set(reg.publicId, { name: details.name, type: reg.kind, balance: details.balance });
    }
  }

  return map;
};
