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

const throwInsufficient = (current: Decimal, delta: Decimal): never => {
  const available = new DecimalJs(current.toString()).toNumber();
  const required = new DecimalJs(delta.toString()).abs().toNumber();
  throw new InsufficientBalanceError(available, required);
};

const incrementBalanceField = async (
  tx: TxClient,
  kind: AccountKind,
  referenceId: number,
  delta: Decimal,
): Promise<void> => {
  const isDebit = new DecimalJs(delta.toString()).isNegative();

  switch (kind) {
    case 'bank': {
      if (isDebit) {
        const abs = delta.abs();
        const result = await tx.bankAccount.updateMany({
          where: { id: referenceId, balance: { gte: abs } },
          data: { balance: { increment: delta } },
        });
        if (result.count === 0) {
          const row = await tx.bankAccount.findUnique({
            where: { id: referenceId },
            select: { balance: true },
          });
          if (!row) throw new Error('Account not found');
          throwInsufficient(row.balance, delta);
        }
      } else {
        await tx.bankAccount.update({
          where: { id: referenceId },
          data: { balance: { increment: delta } },
        });
      }
      break;
    }
    case 'cash': {
      if (isDebit) {
        const abs = delta.abs();
        const result = await tx.cashAccount.updateMany({
          where: { id: referenceId, balance: { gte: abs } },
          data: { balance: { increment: delta } },
        });
        if (result.count === 0) {
          const row = await tx.cashAccount.findUnique({
            where: { id: referenceId },
            select: { balance: true },
          });
          if (!row) throw new Error('Account not found');
          throwInsufficient(row.balance, delta);
        }
      } else {
        await tx.cashAccount.update({
          where: { id: referenceId },
          data: { balance: { increment: delta } },
        });
      }
      break;
    }
    case 'wallet': {
      if (isDebit) {
        const abs = delta.abs();
        const result = await tx.walletAccount.updateMany({
          where: { id: referenceId, balance: { gte: abs } },
          data: { balance: { increment: delta } },
        });
        if (result.count === 0) {
          const row = await tx.walletAccount.findUnique({
            where: { id: referenceId },
            select: { balance: true },
          });
          if (!row) throw new Error('Account not found');
          throwInsufficient(row.balance, delta);
        }
      } else {
        await tx.walletAccount.update({
          where: { id: referenceId },
          data: { balance: { increment: delta } },
        });
      }
      break;
    }
    case 'credit_card':
      await tx.creditCard.update({
        where: { id: referenceId },
        data: { outstandingBalance: { increment: delta } },
      });
      break;
  }
};

const adjustRegistryBalance = async (
  tx: TxClient,
  accountId: number,
  delta: Decimal,
): Promise<void> => {
  const registry = await tx.account.findFirst({
    where: { id: accountId, deletedAt: null },
    select: { kind: true, referenceId: true },
  });
  if (!registry) throw new Error('Account not found');

  if (NON_NEGATIVE_ACCOUNT_KINDS.has(registry.kind) && new DecimalJs(delta.toString()).isNegative()) {
    await incrementBalanceField(tx, registry.kind, registry.referenceId, delta);
    return;
  }

  await incrementBalanceField(tx, registry.kind, registry.referenceId, delta);
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
