import { prisma } from '@/lib/prisma';

export class OwnershipError extends Error {
  constructor(message = 'Account not found or access denied') {
    super(message);
    this.name = 'OwnershipError';
  }
}

export const assertAccountOwnership = async (userId: string, accountId: string): Promise<void> => {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
    select: { id: true },
  });
  if (!account) throw new OwnershipError();
};

export const assertAccountsOwnership = async (
  userId: string,
  accountIds: string[],
): Promise<void> => {
  const uniqueIds = [...new Set(accountIds.filter(Boolean))];
  if (uniqueIds.length === 0) return;
  const count = await prisma.account.count({
    where: { userId, id: { in: uniqueIds } },
  });
  if (count !== uniqueIds.length) throw new OwnershipError();
};
