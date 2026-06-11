import { prisma } from '@/lib/prisma';
import { calculateEmi, toDecimal } from '@/lib/money';
import { assertAccountOwnership } from '@/services/repositories/accounts/ownership';
import type { Loan, CreateLoanData } from '@/types/loan-types';
import { toLoanType } from '@/types/loan-types';

export const listByUser = async (userId: string): Promise<Loan[]> => {
  const loans = await prisma.loan.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return loans.map(toLoanType);
};

export const getById = async (userId: string, id: string): Promise<Loan | null> => {
  const loan = await prisma.loan.findFirst({ where: { id, userId } });
  return loan ? toLoanType(loan) : null;
};

export const create = async (userId: string, data: CreateLoanData): Promise<Loan> => {
  await assertAccountOwnership(userId, data.account_id);

  const emi =
    data.emi_amount ?? calculateEmi(data.principal, data.interest_rate, data.tenure_months);

  const created = await prisma.loan.create({
    data: {
      userId,
      name: data.name,
      principal: data.principal,
      interest_rate: data.interest_rate,
      tenure_months: data.tenure_months,
      emi_amount: emi,
      start_date: new Date(data.start_date),
      accountId: data.account_id,
      categoryId: data.category_id,
      outstanding_balance: data.principal,
    },
  });
  return toLoanType(created);
};

export const update = async (
  userId: string,
  id: string,
  data: Partial<CreateLoanData>,
): Promise<boolean> => {
  if (data.account_id) {
    await assertAccountOwnership(userId, data.account_id);
  }

  const result = await prisma.loan.updateMany({
    where: { id, userId },
    data: {
      name: data.name,
      principal: data.principal,
      interest_rate: data.interest_rate,
      tenure_months: data.tenure_months,
      emi_amount: data.emi_amount,
      start_date: data.start_date ? new Date(data.start_date) : undefined,
      accountId: data.account_id,
      categoryId: data.category_id,
    },
  });
  return result.count > 0;
};

export const remove = async (userId: string, id: string): Promise<boolean> => {
  const result = await prisma.loan.deleteMany({ where: { id, userId } });
  return result.count > 0;
};

export const getOutstanding = async (userId: string, id: string): Promise<number | null> => {
  const loan = await prisma.loan.findFirst({
    where: { id, userId },
    select: { outstanding_balance: true },
  });
  if (!loan) return null;
  return Number(loan.outstanding_balance);
};

export const reduceOutstanding = async (
  userId: string,
  loanId: string,
  amount: number,
): Promise<void> => {
  const loan = await prisma.loan.findFirst({ where: { id: loanId, userId } });
  if (!loan) return;
  const newBalance = Math.max(0, Number(loan.outstanding_balance) - amount);
  await prisma.loan.update({
    where: { id: loanId },
    data: { outstanding_balance: toDecimal(newBalance) },
  });
};
