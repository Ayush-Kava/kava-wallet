import { apiFetch } from '@/lib/api-client';
import type { Category, CreateCategoryData, UpdateCategoryData } from '@/types/category-types';

export const categoriesApi = {
  getCategories: async (): Promise<Category[]> => {
    return apiFetch<Category[]>('/api/categories');
  },

  createCategory: async (newCategory: CreateCategoryData): Promise<Category> => {
    return apiFetch<Category>('/api/categories', 'POST', newCategory);
  },

  updateCategory: async (id: string, data: UpdateCategoryData): Promise<Category> => {
    return apiFetch<Category>(`/api/categories/${id}`, 'PUT', data);
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiFetch<void>(`/api/categories/${id}`, 'DELETE');
  },
};
