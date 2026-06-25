import { prisma } from '@/lib/prisma';
import { calculateEmi, toDecimal } from '@/lib/money';
import { resolveCategoryId } from '@/lib/utils/resolve-owned-resource';
import { assertAccountOwnership } from '@/services/repositories/accounts/ownership';
import type { Loan, CreateLoanData } from '@/types/loan-types';
import { toLoanType } from '@/types/loan-types';

const loanInclude = { account: true, category: true } as const;

export const listByUser = async (userId: number): Promise<Loan[]> => {
  const loans = await prisma.loan.findMany({
    where: { userId },
    include: loanInclude,
    orderBy: { createdAt: 'desc' },
  });
  return loans.map(toLoanType);
};

export const getById = async (userId: number, publicId: string): Promise<Loan | null> => {
  const loan = await prisma.loan.findFirst({
    where: { publicId, userId },
    include: loanInclude,
  });
  return loan ? toLoanType(loan) : null;
};

export const create = async (userId: number, data: CreateLoanData): Promise<Loan> => {
  const accountId = await assertAccountOwnership(userId, data.account_id);

  let categoryId: number | null = null;
  if (data.category_id) {
    categoryId = await resolveCategoryId(userId, data.category_id);
    if (!categoryId) throw new Error('Invalid category');
  }

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
      accountId,
      categoryId,
      outstanding_balance: data.principal,
    },
    include: loanInclude,
  });
  return toLoanType(created);
};

export const update = async (
  userId: number,
  publicId: string,
  data: Partial<CreateLoanData>,
): Promise<boolean> => {
  let accountId: number | undefined;
  if (data.account_id) {
    accountId = await assertAccountOwnership(userId, data.account_id);
  }

  let categoryId: number | null | undefined;
  if (data.category_id !== undefined) {
    if (data.category_id) {
      categoryId = await resolveCategoryId(userId, data.category_id);
      if (!categoryId) throw new Error('Invalid category');
    } else {
      categoryId = null;
    }
  }

  const result = await prisma.loan.updateMany({
    where: { publicId, userId },
    data: {
      name: data.name,
      principal: data.principal,
      interest_rate: data.interest_rate,
      tenure_months: data.tenure_months,
      emi_amount: data.emi_amount,
      start_date: data.start_date ? new Date(data.start_date) : undefined,
      accountId,
      categoryId,
    },
  });
  return result.count > 0;
};

export const remove = async (userId: number, publicId: string): Promise<boolean> => {
  const result = await prisma.loan.deleteMany({ where: { publicId, userId } });
  return result.count > 0;
};

export const getOutstanding = async (userId: number, publicId: string): Promise<number | null> => {
  const loan = await prisma.loan.findFirst({
    where: { publicId, userId },
    select: { outstanding_balance: true },
  });
  if (!loan) return null;
  return Number(loan.outstanding_balance);
};

export const reduceOutstanding = async (
  userId: number,
  loanId: number,
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
