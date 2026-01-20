export type GoalPriority = 'low' | 'medium' | 'high';
export type GoalStatus = 'active' | 'completed' | 'paused';

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  target_date: string;
  priority: GoalPriority;
  notes?: string | null;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export interface GoalFunding {
  id: string;
  goal_id: string;
  user_id: string;
  source_type: 'account' | 'investment';
  source_id: string;
  allocated_amount: number;
  created_at: string;
  updated_at: string;
}

export interface GoalWithFunding extends Goal {
  funding: GoalFunding[];
  accounts?: Array<{
    id: string;
    name: string;
    balance: number;
    allocated: number;
  }>;
  investments?: Array<{
    id: string;
    name: string;
    current_value: number;
    allocated: number;
  }>;
  total_saved: number;
  remaining: number;
  progress_percentage: number;
}

export interface CreateGoalData {
  name: string;
  target_amount: number;
  target_date: string;
  priority: GoalPriority;
  notes?: string;
  status?: GoalStatus;
}

export interface UpdateGoalData extends Partial<CreateGoalData> {
  id: string;
}

export interface CreateGoalFundingData {
  goal_id: string;
  source_type: 'account' | 'investment';
  source_id: string;
  allocated_amount: number;
}

export interface UpdateGoalFundingData extends Partial<CreateGoalFundingData> {
  id: string;
}

export const GOAL_PRIORITY_LABELS: Record<GoalPriority, string> = {
  low: 'Low Priority',
  medium: 'Medium Priority',
  high: 'High Priority',
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  paused: 'Paused',
};

export const GOAL_PRIORITY_COLORS: Record<GoalPriority, string> = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};
