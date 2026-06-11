import type { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import DecimalJs from 'decimal.js';

export type MoneyInput = Decimal | number | string;
export type TxClient = Prisma.TransactionClient;

export const toDecimal = (value: MoneyInput): Decimal => {
  return new Decimal(new DecimalJs(value).toFixed(2));
};

export const applyTransactionDelta = async (
  tx: TxClient,
  accountId: string,
  type: 'income' | 'expense',
  amount: MoneyInput,
): Promise<void> => {
  const delta = toDecimal(amount);
  const signed = type === 'income' ? delta : delta.negated();
  await tx.account.update({
    where: { id: accountId },
    data: { balance: { increment: signed } },
  });
};

export const reverseTransactionDelta = async (
  tx: TxClient,
  accountId: string,
  type: 'income' | 'expense',
  amount: MoneyInput,
): Promise<void> => {
  const delta = toDecimal(amount);
  const signed = type === 'income' ? delta.negated() : delta;
  await tx.account.update({
    where: { id: accountId },
    data: { balance: { increment: signed } },
  });
};

export const applyTransferDeltas = async (
  tx: TxClient,
  fromAccountId: string,
  toAccountId: string,
  amount: MoneyInput,
): Promise<void> => {
  const value = toDecimal(amount);
  await tx.account.update({
    where: { id: fromAccountId },
    data: { balance: { decrement: value } },
  });
  await tx.account.update({
    where: { id: toAccountId },
    data: { balance: { increment: value } },
  });
};

export const reverseTransferDeltas = async (
  tx: TxClient,
  fromAccountId: string,
  toAccountId: string,
  amount: MoneyInput,
): Promise<void> => {
  const value = toDecimal(amount);
  await tx.account.update({
    where: { id: fromAccountId },
    data: { balance: { increment: value } },
  });
  await tx.account.update({
    where: { id: toAccountId },
    data: { balance: { decrement: value } },
  });
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
