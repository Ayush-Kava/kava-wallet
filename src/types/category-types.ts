export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
}

export interface CreateCategoryData {
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
}
