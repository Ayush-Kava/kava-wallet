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

export const toCategoryType = (category: any): Category => ({
  id: category.id,
  user_id: category.userId,
  name: category.name,
  type: category.type,
  icon: category.icon,
  color: category.color,
  is_default: category.is_default || false,
  created_at: category.createdAt.toISOString(),
});
