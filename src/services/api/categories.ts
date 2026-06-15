import { apiFetch } from '@/lib/api-client';
import type { Category, CreateCategoryData, UpdateCategoryData } from '@/types/category-types';

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

  updateCategory: async (
    userId: string,
    id: string,
    data: UpdateCategoryData,
  ): Promise<Category> => {
    return apiFetch<Category>(`/api/categories/${id}`, 'PUT', {
      ...data,
      user_id: userId,
    });
  },

  deleteCategory: async (userId: string, id: string): Promise<void> => {
    await apiFetch<void>(`/api/categories/${id}`, 'DELETE', {
      user_id: userId,
    });
  },
};
