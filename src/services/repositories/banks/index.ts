import { prisma } from '@/lib/prisma';
import type { Bank } from '@/types/account-types';
import { toBankType } from '@/types/account-types';

export const listActive = async (): Promise<Bank[]> => {
  const banks = await prisma.bank.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  return banks.map(toBankType);
};

export const listAll = async (): Promise<Bank[]> => {
  const banks = await prisma.bank.findMany({ orderBy: { name: 'asc' } });
  return banks.map(toBankType);
};

export const create = async (name: string, ifscPrefix?: string): Promise<Bank> => {
  const bank = await prisma.bank.create({
    data: { name, ifscPrefix },
  });
  return toBankType(bank);
};

export const update = async (
  publicId: string,
  data: { name?: string; ifsc_prefix?: string; is_active?: boolean },
): Promise<Bank | null> => {
  const bank = await prisma.bank.update({
    where: { publicId },
    data: {
      name: data.name,
      ifscPrefix: data.ifsc_prefix,
      isActive: data.is_active,
    },
  });
  return toBankType(bank);
};

export const remove = async (publicId: string): Promise<void> => {
  await prisma.bank.delete({ where: { publicId } });
};
