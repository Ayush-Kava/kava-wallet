import { apiFetch } from '@/lib/api-client';
import type { Category, CreateCategoryData } from '@/types/category-types';

export const categoriesApi = {
  getCategories: async (userId: string): Promise<Category[]> => {
    return apiFetch<Category[]>(`/api/categories?userId=${encodeURIComponent(userId)}`);
  },

  createCategory: async (userId: string, newCategory: CreateCategoryData): Promise<Category> => {
    return apiFetch<Category>(`/api/categories`, 'POST', {
      ...newCategory,
      user_id: userId,
    });
  },
};
