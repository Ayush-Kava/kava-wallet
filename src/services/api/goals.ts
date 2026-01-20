import { supabase } from '@/integrations/supabase/client';
import type {
  Goal,
  GoalWithFunding,
  CreateGoalData,
  UpdateGoalData,
  GoalFunding,
  CreateGoalFundingData,
  UpdateGoalFundingData,
} from '@/types/goal-types';

export const goalsApi = {
  // Get all goals for user
  getGoals: async (userId: string): Promise<GoalWithFunding[]> => {
    const { data, error } = await (supabase
      .from('goals' as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }) as any);

    if (error) throw error;

    const goals = (data || []) as Goal[];

    // Enrich each goal with funding data
    const enrichedGoals = await Promise.all(
      goals.map(async (goal) => {
        const { data: fundingData } = await (supabase
          .from('goal_funding' as any)
          .select('*')
          .eq('goal_id', goal.id)
          .eq('user_id', userId) as any);

        const funding = (fundingData || []) as GoalFunding[];
        const total_saved = funding.reduce(
          (sum, f) => sum + f.allocated_amount,
          0,
        );
        const remaining = goal.target_amount - total_saved;
        const progress_percentage = Math.min(
          (total_saved / goal.target_amount) * 100,
          100,
        );

        return {
          ...goal,
          funding,
          total_saved,
          remaining,
          progress_percentage,
        } as GoalWithFunding;
      }),
    );

    return enrichedGoals;
  },

  // Get single goal with detailed funding info
  getGoal: async (userId: string, goalId: string): Promise<GoalWithFunding> => {
    const { data: goalData, error: goalError } = await (supabase
      .from('goals' as any)
      .select('*')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single() as any);

    if (goalError) throw goalError;

    const goal = goalData as Goal;

    // Get funding data
    const { data: fundingData } = await (supabase
      .from('goal_funding' as any)
      .select('*')
      .eq('goal_id', goalId)
      .eq('user_id', userId) as any);

    const funding = (fundingData || []) as GoalFunding[];

    // Get account details for account fundings
    const accountFundings = funding.filter((f) => f.source_type === 'account');
    const accountIds = accountFundings.map((f) => f.source_id);
    let accounts: any[] = [];

    if (accountIds.length > 0) {
      const { data: accountsData } = await (supabase
        .from('accounts' as any)
        .select('id, name, balance')
        .in('id', accountIds) as any);

      accounts = (accountsData || []).map((acc: any) => ({
        ...acc,
        allocated:
          accountFundings.find((f) => f.source_id === acc.id)
            ?.allocated_amount || 0,
      }));
    }

    // Get investment details for investment fundings
    const investmentFundings = funding.filter(
      (f) => f.source_type === 'investment',
    );
    const investmentIds = investmentFundings.map((f) => f.source_id);
    let investments: any[] = [];

    if (investmentIds.length > 0) {
      const { data: investmentsData } = await (supabase
        .from('investments' as any)
        .select('id, name, current_value')
        .in('id', investmentIds) as any);

      investments = (investmentsData || []).map((inv: any) => ({
        ...inv,
        allocated:
          investmentFundings.find((f) => f.source_id === inv.id)
            ?.allocated_amount || 0,
      }));
    }

    const total_saved = funding.reduce((sum, f) => sum + f.allocated_amount, 0);
    const remaining = goal.target_amount - total_saved;
    const progress_percentage = Math.min(
      (total_saved / goal.target_amount) * 100,
      100,
    );

    return {
      ...goal,
      funding,
      accounts,
      investments,
      total_saved,
      remaining,
      progress_percentage,
    };
  },

  // Create goal
  createGoal: async (
    userId: string,
    payload: CreateGoalData,
  ): Promise<Goal> => {
    const { data, error } = await (supabase
      .from('goals' as any)
      .insert({
        user_id: userId,
        status: payload.status || 'active',
        ...payload,
      })
      .select()
      .single() as any);

    if (error) throw error;
    return data as Goal;
  },

  // Update goal
  updateGoal: async (
    userId: string,
    { id, ...rest }: UpdateGoalData,
  ): Promise<void> => {
    const { error } = await (supabase
      .from('goals' as any)
      .update(rest)
      .eq('id', id)
      .eq('user_id', userId) as any);

    if (error) throw error;
  },

  // Delete goal
  deleteGoal: async (userId: string, goalId: string): Promise<void> => {
    // First delete all funding records
    await (supabase
      .from('goal_funding' as any)
      .delete()
      .eq('goal_id', goalId)
      .eq('user_id', userId) as any);

    // Then delete the goal
    const { error } = await (supabase
      .from('goals' as any)
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId) as any);

    if (error) throw error;
  },

  // Goal Funding Operations
  addFunding: async (
    userId: string,
    payload: CreateGoalFundingData,
  ): Promise<GoalFunding> => {
    const { data, error } = await (supabase
      .from('goal_funding' as any)
      .insert({
        user_id: userId,
        ...payload,
      })
      .select()
      .single() as any);

    if (error) throw error;
    return data as GoalFunding;
  },

  updateFunding: async (
    userId: string,
    { id, ...rest }: UpdateGoalFundingData,
  ): Promise<void> => {
    const { error } = await (supabase
      .from('goal_funding' as any)
      .update(rest)
      .eq('id', id)
      .eq('user_id', userId) as any);

    if (error) throw error;
  },

  removeFunding: async (userId: string, fundingId: string): Promise<void> => {
    const { error } = await (supabase
      .from('goal_funding' as any)
      .delete()
      .eq('id', fundingId)
      .eq('user_id', userId) as any);

    if (error) throw error;
  },

  // Get funding for a specific goal
  getGoalFunding: async (
    userId: string,
    goalId: string,
  ): Promise<GoalFunding[]> => {
    const { data, error } = await (supabase
      .from('goal_funding' as any)
      .select('*')
      .eq('goal_id', goalId)
      .eq('user_id', userId) as any);

    if (error) throw error;
    return (data || []) as GoalFunding[];
  },
};
