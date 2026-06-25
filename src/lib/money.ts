import type { AccountKind, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import DecimalJs from 'decimal.js';
import { InsufficientBalanceError } from '@/lib/insufficient-balance';

export type MoneyInput = Decimal | number | string;
export type TxClient = Prisma.TransactionClient;

const NON_NEGATIVE_ACCOUNT_KINDS = new Set<AccountKind>(['cash', 'bank', 'wallet']);

export const toDecimal = (value: MoneyInput): Decimal => {
  return new Decimal(new DecimalJs(value).toFixed(2));
};

const getRegistryBalance = async (
  tx: TxClient,
  kind: AccountKind,
  referenceId: number,
): Promise<Decimal> => {
  switch (kind) {
    case 'bank': {
      const row = await tx.bankAccount.findUnique({
        where: { id: referenceId },
        select: { balance: true },
      });
      if (!row) throw new Error('Account not found');
      return row.balance;
    }
    case 'cash': {
      const row = await tx.cashAccount.findUnique({
        where: { id: referenceId },
        select: { balance: true },
      });
      if (!row) throw new Error('Account not found');
      return row.balance;
    }
    case 'wallet': {
      const row = await tx.walletAccount.findUnique({
        where: { id: referenceId },
        select: { balance: true },
      });
      if (!row) throw new Error('Account not found');
      return row.balance;
    }
    case 'credit_card': {
      const row = await tx.creditCard.findUnique({
        where: { id: referenceId },
        select: { outstandingBalance: true },
      });
      if (!row) throw new Error('Account not found');
      return row.outstandingBalance;
    }
  }
};

const assertSufficientBalance = async (
  tx: TxClient,
  kind: AccountKind,
  referenceId: number,
  delta: Decimal,
): Promise<void> => {
  if (!NON_NEGATIVE_ACCOUNT_KINDS.has(kind)) return;

  const current = await getRegistryBalance(tx, kind, referenceId);
  const newBalance = new DecimalJs(current.toString()).plus(delta.toString());
  if (newBalance.lessThan(0)) {
    const available = new DecimalJs(current.toString()).toNumber();
    const required = new DecimalJs(delta.toString()).abs().toNumber();
    throw new InsufficientBalanceError(available, required);
  }
};

const adjustRegistryBalance = async (
  tx: TxClient,
  accountId: number,
  delta: Decimal,
): Promise<void> => {
  const registry = await tx.account.findUnique({ where: { id: accountId } });
  if (!registry) throw new Error('Account not found');

  await assertSufficientBalance(tx, registry.kind, registry.referenceId, delta);

  switch (registry.kind) {
    case 'bank':
      await tx.bankAccount.update({
        where: { id: registry.referenceId },
        data: { balance: { increment: delta } },
      });
      break;
    case 'cash':
      await tx.cashAccount.update({
        where: { id: registry.referenceId },
        data: { balance: { increment: delta } },
      });
      break;
    case 'wallet':
      await tx.walletAccount.update({
        where: { id: registry.referenceId },
        data: { balance: { increment: delta } },
      });
      break;
    case 'credit_card':
      await tx.creditCard.update({
        where: { id: registry.referenceId },
        data: { outstandingBalance: { increment: delta } },
      });
      break;
  }
};

export const applyTransactionDelta = async (
  tx: TxClient,
  accountId: number,
  type: 'income' | 'expense',
  amount: MoneyInput,
): Promise<void> => {
  const delta = toDecimal(amount);
  const signed = type === 'income' ? delta : delta.negated();
  await adjustRegistryBalance(tx, accountId, signed);
};

export const reverseTransactionDelta = async (
  tx: TxClient,
  accountId: number,
  type: 'income' | 'expense',
  amount: MoneyInput,
): Promise<void> => {
  const delta = toDecimal(amount);
  const signed = type === 'income' ? delta.negated() : delta;
  await adjustRegistryBalance(tx, accountId, signed);
};

export const applyTransferDeltas = async (
  tx: TxClient,
  fromAccountId: number,
  toAccountId: number,
  amount: MoneyInput,
): Promise<void> => {
  const value = toDecimal(amount);
  await adjustRegistryBalance(tx, fromAccountId, value.negated());
  await adjustRegistryBalance(tx, toAccountId, value);
};

export const reverseTransferDeltas = async (
  tx: TxClient,
  fromAccountId: number,
  toAccountId: number,
  amount: MoneyInput,
): Promise<void> => {
  const value = toDecimal(amount);
  await adjustRegistryBalance(tx, fromAccountId, value);
  await adjustRegistryBalance(tx, toAccountId, value.negated());
};

export const calculateEmi = (
  principal: number,
  annualRate: number,
  tenureMonths: number,
): number => {
  if (tenureMonths <= 0) return 0;
  if (annualRate === 0) {
    return new DecimalJs(principal).div(tenureMonths).toDecimalPlaces(2).toNumber();
  }
  const r = new DecimalJs(annualRate).div(12).div(100);
  const p = new DecimalJs(principal);
  const onePlusR = r.plus(1);
  const numerator = p.times(r).times(onePlusR.pow(tenureMonths));
  const denominator = onePlusR.pow(tenureMonths).minus(1);
  return numerator.div(denominator).toDecimalPlaces(2).toNumber();
};
