import { prisma } from '@/lib/prisma';
import { assertAccountOwnership } from '@/services/repositories/accounts/ownership';
import { resolveOwnedId } from '@/lib/utils/resolve-owned-resource';
import { asPublicId } from '@/lib/public-id';
import { getAccountSummaryByPublicIds } from '@/services/repositories/accounts';
import type {
  Goal,
  GoalWithFunding,
  GoalFunding,
  CreateGoalData,
  CreateGoalFundingData,
} from '@/types/goal-types';
import { toGoalType, toGoalFundingType, mapGoalStatusToDb } from '@/types/goal-types';

const enrichGoalWithFunding = async (
  userId: number,
  goal: ReturnType<typeof toGoalType>,
  funding: GoalFunding[],
): Promise<GoalWithFunding> => {
  const total_saved = funding.reduce((sum, f) => sum + f.allocated_amount, 0);
  const remaining = Math.max(0, goal.target_amount - total_saved);
  const progress_percentage =
    goal.target_amount > 0 ? Math.min(100, (total_saved / goal.target_amount) * 100) : 0;

  const accountPublicIds = funding
    .filter(f => f.source_type === 'account')
    .map(f => f.source_id);
  const investmentPublicIds = funding
    .filter(f => f.source_type === 'investment')
    .map(f => f.source_id);

  const [accountSummaries, investments] = await Promise.all([
    accountPublicIds.length
      ? getAccountSummaryByPublicIds(userId, accountPublicIds)
      : Promise.resolve(new Map()),
    investmentPublicIds.length
      ? prisma.investment.findMany({
          where: { userId, publicId: { in: investmentPublicIds } },
        })
      : Promise.resolve([]),
  ]);

  const accountsEnriched = accountPublicIds.map(accountPublicId => {
    const summary = accountSummaries.get(accountPublicId);
    const allocated =
      funding.find(f => f.source_type === 'account' && f.source_id === accountPublicId)
        ?.allocated_amount ?? 0;
    return {
      id: asPublicId(accountPublicId),
      name: summary?.name ?? 'Account',
      balance: summary ? summary.balance : 0,
      allocated,
    };
  });

  const investmentsEnriched = investments.map(inv => {
    const allocated =
      funding.find(f => f.source_type === 'investment' && f.source_id === inv.publicId)
        ?.allocated_amount ?? 0;
    return {
      id: asPublicId(inv.publicId),
      name: inv.name,
      current_value: Number(inv.current_value),
      allocated,
    };
  });

  return {
    ...goal,
    funding,
    accounts: accountsEnriched,
    investments: investmentsEnriched,
    total_saved,
    remaining,
    progress_percentage,
  };
};

export const listByUser = async (userId: number): Promise<GoalWithFunding[]> => {
  const goals = await prisma.goal.findMany({
    where: { userId },
    include: { funding: { include: { goal: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return Promise.all(
    goals.map(async g => {
      const goal = toGoalType(g);
      const funding = g.funding.map(toGoalFundingType);
      return enrichGoalWithFunding(userId, goal, funding);
    }),
  );
};

export const getById = async (
  userId: number,
  publicId: string,
): Promise<GoalWithFunding | null> => {
  const goal = await prisma.goal.findFirst({
    where: { publicId, userId },
    include: { funding: { include: { goal: true } } },
  });
  if (!goal) return null;
  const mapped = toGoalType(goal);
  const funding = goal.funding.map(toGoalFundingType);
  return enrichGoalWithFunding(userId, mapped, funding);
};

export const create = async (userId: number, data: CreateGoalData): Promise<Goal> => {
  const created = await prisma.goal.create({
    data: {
      userId,
      name: data.name,
      target_amount: data.target_amount,
      target_date: new Date(data.target_date),
      priority: data.priority,
      notes: data.notes,
      status: (mapGoalStatusToDb(data.status) as any) ?? 'active',
    },
  });
  return toGoalType(created);
};

export const update = async (
  userId: number,
  publicId: string,
  data: Partial<CreateGoalData>,
): Promise<boolean> => {
  const result = await prisma.goal.updateMany({
    where: { publicId, userId },
    data: {
      name: data.name,
      target_amount: data.target_amount,
      target_date: data.target_date ? new Date(data.target_date) : undefined,
      priority: data.priority,
      notes: data.notes,
      status: mapGoalStatusToDb(data.status) as any,
    },
  });
  return result.count > 0;
};

export const remove = async (userId: number, publicId: string): Promise<boolean> => {
  const result = await prisma.goal.deleteMany({ where: { publicId, userId } });
  return result.count > 0;
};

export const listFunding = async (userId: number, goalPublicId: string): Promise<GoalFunding[]> => {
  const goal = await prisma.goal.findFirst({ where: { publicId: goalPublicId, userId } });
  if (!goal) return [];
  const funding = await prisma.goalFunding.findMany({
    where: { goalId: goal.id, userId },
    include: { goal: true },
    orderBy: { createdAt: 'desc' },
  });
  return funding.map(toGoalFundingType);
};

export const addFunding = async (
  userId: number,
  data: CreateGoalFundingData,
): Promise<GoalFunding | null> => {
  const goal = await prisma.goal.findFirst({
    where: { publicId: data.goal_id, userId },
  });
  if (!goal) return null;

  if (data.source_type === 'account') {
    try {
      await assertAccountOwnership(userId, data.source_id);
    } catch {
      return null;
    }
  } else {
    const investmentId = await resolveOwnedId('investment', userId, data.source_id);
    if (!investmentId) return null;
  }

  const created = await prisma.goalFunding.upsert({
    where: {
      goalId_source_type_source_public_id: {
        goalId: goal.id,
        source_type: data.source_type,
        source_public_id: data.source_id,
      },
    },
    create: {
      goalId: goal.id,
      userId,
      source_type: data.source_type,
      source_public_id: data.source_id,
      allocated_amount: data.allocated_amount,
    },
    update: { allocated_amount: data.allocated_amount },
    include: { goal: true },
  });
  return toGoalFundingType(created);
};

export const updateFunding = async (
  userId: number,
  publicId: string,
  data: Partial<CreateGoalFundingData>,
): Promise<boolean> => {
  const updateData: {
    source_type?: string;
    source_public_id?: string;
    allocated_amount?: number;
  } = {};

  if (data.source_type !== undefined) updateData.source_type = data.source_type;
  if (data.allocated_amount !== undefined) updateData.allocated_amount = data.allocated_amount;

  if (data.source_id !== undefined) {
    if (data.source_type === 'account' || !data.source_type) {
      try {
        await assertAccountOwnership(userId, data.source_id);
      } catch {
        if (data.source_type === 'account') return false;
      }
    }
    if (data.source_type === 'investment') {
      const investmentId = await resolveOwnedId('investment', userId, data.source_id);
      if (!investmentId) return false;
    }
    updateData.source_public_id = data.source_id;
  }

  const result = await prisma.goalFunding.updateMany({
    where: { publicId, userId },
    data: updateData,
  });
  return result.count > 0;
};

export const removeFunding = async (userId: number, publicId: string): Promise<boolean> => {
  const result = await prisma.goalFunding.deleteMany({ where: { publicId, userId } });
  return result.count > 0;
};
