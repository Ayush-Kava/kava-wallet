import { prisma } from '@/lib/prisma';

export class OwnershipError extends Error {
  constructor(message = 'Account not found or access denied') {
    super(message);
    this.name = 'OwnershipError';
  }
}

const activeAccountFilter = {
  deletedAt: null,
} as const;

export const resolveAccountInternalId = async (
  userId: number,
  accountPublicId: string,
): Promise<number | null> => {
  const account = await prisma.account.findFirst({
    where: { publicId: accountPublicId, userId, ...activeAccountFilter },
    select: { id: true },
  });
  return account?.id ?? null;
};

export const assertAccountOwnership = async (
  userId: number,
  accountPublicId: string,
): Promise<number> => {
  const id = await resolveAccountInternalId(userId, accountPublicId);
  if (!id) throw new OwnershipError();
  return id;
};

export const assertAccountsOwnership = async (
  userId: number,
  accountPublicIds: string[],
): Promise<number[]> => {
  const uniqueIds = [...new Set(accountPublicIds.filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  const accounts = await prisma.account.findMany({
    where: { userId, publicId: { in: uniqueIds }, ...activeAccountFilter },
    select: { id: true, publicId: true },
  });

  if (accounts.length !== uniqueIds.length) throw new OwnershipError();
  return accounts.map(a => a.id);
};
