import { asPublicId } from '@/lib/public-id';

export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
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

export interface UpdateCategoryData {
  name?: string;
  color?: string;
  icon?: string;
}

export const toCategoryType = (category: any): Category => ({
  id: asPublicId(category.publicId),
  name: category.name,
  type: category.type,
  icon: category.icon,
  color: category.color,
  is_default: category.is_default || false,
  created_at: category.createdAt.toISOString(),
});
