import { prisma } from '@/lib/prisma';
import { asPublicId } from '@/lib/public-id';
import { assertAccountOwnership } from '@/services/repositories/accounts/ownership';
import { getAccountSummaryByPublicIds } from '@/services/repositories/accounts';
import type { Investment, InvestmentDetail, CreateInvestmentData } from '@/types/investment-types';
import { toInvestmentType } from '@/types/investment-types';

const investmentInclude = { account: true } as const;

type InvestmentRow = Awaited<
  ReturnType<typeof prisma.investment.findMany<{ include: typeof investmentInclude }>>
>[number];

const mapInvestments = async (userId: number, investments: InvestmentRow[]) => {
  const labels = await getAccountSummaryByPublicIds(
    userId,
    investments.map(inv => inv.account.publicId),
  );
  return investments.map(inv => {
    const meta = labels.get(inv.account.publicId);
    return toInvestmentType(
      inv,
      meta ? { id: asPublicId(inv.account.publicId), name: meta.name } : undefined,
    );
  });
};

export const listByUser = async (userId: number): Promise<Investment[]> => {
  const investments = await prisma.investment.findMany({
    where: { userId },
    include: investmentInclude,
    orderBy: { createdAt: 'desc' },
  });
  return mapInvestments(userId, investments);
};

export const getById = async (
  userId: number,
  publicId: string,
): Promise<InvestmentDetail | null> => {
  const investment = await prisma.investment.findFirst({
    where: { publicId, userId },
    include: investmentInclude,
  });
  if (!investment) return null;

  const links = await prisma.documentLink.findMany({
    where: { userId, linked_entity_public_id: investment.publicId },
    include: { document: true },
  });

  const [mapped] = await mapInvestments(userId, [investment]);

  return {
    ...mapped,
    linkedDocuments: links.map(l => ({
      id: asPublicId(l.document.publicId),
      name: l.document.name,
    })),
  };
};

export const listByAccount = async (
  userId: number,
  accountPublicId: string,
): Promise<Investment[]> => {
  const account = await prisma.account.findFirst({
    where: { publicId: accountPublicId, userId },
    select: { id: true },
  });
  if (!account) return [];

  const investments = await prisma.investment.findMany({
    where: { userId, accountId: account.id },
    include: investmentInclude,
    orderBy: { createdAt: 'desc' },
  });
  return mapInvestments(userId, investments);
};

export const create = async (userId: number, data: CreateInvestmentData): Promise<Investment> => {
  const accountId = await assertAccountOwnership(userId, data.account_id);

  const created = await prisma.investment.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      invested_amount: data.invested_amount,
      current_value: data.current_value,
      accountId,
      start_date: new Date(data.start_date),
      notes: data.notes,
    },
    include: investmentInclude,
  });
  const [mapped] = await mapInvestments(userId, [created]);
  return mapped;
};

export const update = async (
  userId: number,
  publicId: string,
  data: Partial<CreateInvestmentData>,
): Promise<boolean> => {
  let accountId: number | undefined;
  if (data.account_id) {
    accountId = await assertAccountOwnership(userId, data.account_id);
  }

  const result = await prisma.investment.updateMany({
    where: { publicId, userId },
    data: {
      name: data.name,
      type: data.type,
      invested_amount: data.invested_amount,
      current_value: data.current_value,
      accountId,
      start_date: data.start_date ? new Date(data.start_date) : undefined,
      notes: data.notes,
    },
  });
  return result.count > 0;
};

export const remove = async (userId: number, publicId: string): Promise<boolean> => {
  const result = await prisma.investment.deleteMany({ where: { publicId, userId } });
  return result.count > 0;
};

export const getTotalInvested = async (userId: number): Promise<number> => {
  const result = await prisma.investment.aggregate({
    where: { userId },
    _sum: { invested_amount: true },
  });
  return Number(result._sum.invested_amount ?? 0);
};

export const getTotalCurrentValue = async (userId: number): Promise<number> => {
  const result = await prisma.investment.aggregate({
    where: { userId },
    _sum: { current_value: true },
  });
  return Number(result._sum.current_value ?? 0);
};
