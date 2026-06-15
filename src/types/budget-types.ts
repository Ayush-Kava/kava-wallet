export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  period: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  categories?: { name: string; color: string; icon: string };
}

export interface CreateBudgetData {
  category_id: string;
  amount: number;
  period: string;
  start_date: string;
  end_date?: string | null;
}

export interface UpdateBudgetData {
  amount?: number;
  period?: string;
  start_date?: string;
  end_date?: string | null;
}

export const toBudgetType = (budget: any): Budget => ({
  id: budget.id,
  user_id: budget.userId,
  category_id: budget.categoryId,
  amount: Number(budget.amount),
  period: budget.period,
  start_date: budget.start_date?.toISOString().split('T')[0],
  end_date: budget.end_date?.toISOString().split('T')[0] || null,
  created_at: budget.createdAt.toISOString(),
  updated_at: budget.updatedAt.toISOString(),
  ...(budget.category
    ? {
        categories: {
          name: budget.category.name,
          color: budget.category.color,
          icon: budget.category.icon,
        },
      }
    : {}),
});
