import type { Account, Investment } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type {
  Goal,
  GoalWithFunding,
  GoalFunding,
  CreateGoalData,
  CreateGoalFundingData,
} from '@/types/goal-types';
import { toGoalType, toGoalFundingType, mapGoalStatusToDb } from '@/types/goal-types';

const enrichGoalWithFunding = async (
  userId: string,
  goal: ReturnType<typeof toGoalType>,
  funding: GoalFunding[],
): Promise<GoalWithFunding> => {
  const total_saved = funding.reduce((sum, f) => sum + f.allocated_amount, 0);
  const remaining = Math.max(0, goal.target_amount - total_saved);
  const progress_percentage =
    goal.target_amount > 0 ? Math.min(100, (total_saved / goal.target_amount) * 100) : 0;

  const accountIds = funding.filter(f => f.source_type === 'account').map(f => f.source_id);
  const investmentIds = funding.filter(f => f.source_type === 'investment').map(f => f.source_id);

  const [accounts, investments] = await Promise.all([
    accountIds.length
      ? prisma.account.findMany({
          where: { userId, id: { in: accountIds } },
        })
      : Promise.resolve([] as Account[]),
    investmentIds.length
      ? prisma.investment.findMany({
          where: { userId, id: { in: investmentIds } },
        })
      : Promise.resolve([] as Investment[]),
  ]);

  const accountsEnriched = accounts.map(a => {
    const allocated =
      funding.find(f => f.source_type === 'account' && f.source_id === a.id)?.allocated_amount ?? 0;
    return {
      id: a.id,
      name: a.name,
      balance: Number(a.balance),
      allocated,
    };
  });

  const investmentsEnriched = investments.map(inv => {
    const allocated =
      funding.find(f => f.source_type === 'investment' && f.source_id === inv.id)
        ?.allocated_amount ?? 0;
    return {
      id: inv.id,
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

export const listByUser = async (userId: string): Promise<GoalWithFunding[]> => {
  const goals = await prisma.goal.findMany({
    where: { userId },
    include: { funding: true },
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

export const getById = async (userId: string, id: string): Promise<GoalWithFunding | null> => {
  const goal = await prisma.goal.findFirst({
    where: { id, userId },
    include: { funding: true },
  });
  if (!goal) return null;
  const mapped = toGoalType(goal);
  const funding = goal.funding.map(toGoalFundingType);
  return enrichGoalWithFunding(userId, mapped, funding);
};

export const create = async (userId: string, data: CreateGoalData): Promise<Goal> => {
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
  userId: string,
  id: string,
  data: Partial<CreateGoalData>,
): Promise<boolean> => {
  const result = await prisma.goal.updateMany({
    where: { id, userId },
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

export const remove = async (userId: string, id: string): Promise<boolean> => {
  const result = await prisma.goal.deleteMany({ where: { id, userId } });
  return result.count > 0;
};

export const listFunding = async (userId: string, goalId: string): Promise<GoalFunding[]> => {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) return [];
  const funding = await prisma.goalFunding.findMany({
    where: { goalId, userId },
    orderBy: { createdAt: 'desc' },
  });
  return funding.map(toGoalFundingType);
};

export const addFunding = async (
  userId: string,
  data: CreateGoalFundingData,
): Promise<GoalFunding | null> => {
  const goal = await prisma.goal.findFirst({
    where: { id: data.goal_id, userId },
  });
  if (!goal) return null;

  if (data.source_type === 'account') {
    const account = await prisma.account.findFirst({
      where: { id: data.source_id, userId },
    });
    if (!account) return null;
  } else {
    const investment = await prisma.investment.findFirst({
      where: { id: data.source_id, userId },
    });
    if (!investment) return null;
  }

  const created = await prisma.goalFunding.upsert({
    where: {
      goalId_source_type_source_id: {
        goalId: data.goal_id,
        source_type: data.source_type,
        source_id: data.source_id,
      },
    },
    create: {
      goalId: data.goal_id,
      userId,
      source_type: data.source_type,
      source_id: data.source_id,
      allocated_amount: data.allocated_amount,
    },
    update: { allocated_amount: data.allocated_amount },
  });
  return toGoalFundingType(created);
};

export const updateFunding = async (
  userId: string,
  id: string,
  data: Partial<CreateGoalFundingData>,
): Promise<boolean> => {
  const result = await prisma.goalFunding.updateMany({
    where: { id, userId },
    data: {
      source_type: data.source_type,
      source_id: data.source_id,
      allocated_amount: data.allocated_amount,
    },
  });
  return result.count > 0;
};

export const removeFunding = async (userId: string, id: string): Promise<boolean> => {
  const result = await prisma.goalFunding.deleteMany({ where: { id, userId } });
  return result.count > 0;
};
