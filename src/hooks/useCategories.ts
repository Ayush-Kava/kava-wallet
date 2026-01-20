import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { categoriesApi } from '@/services/api/categories';
import type {
  CreateCategoryData
} from '@/types/category-types';

export const useCategories = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', user?.id],
    queryFn: async () => {
      return categoriesApi.getCategories(user!.id);
    },
    enabled: !!user,
  });

  const createCategory = useMutation({
    mutationFn: async (newCategory: CreateCategoryData) =>
      categoriesApi.createCategory(user!.id, newCategory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const incomeCategories = categories?.filter((c) => c.type === 'income') || [];
  const expenseCategories =
    categories?.filter((c) => c.type === 'expense') || [];

  return {
    categories: categories || [],
    incomeCategories,
    expenseCategories,
    isLoading,
    createCategory,
  };
};

export type {
  Category,
  CategoryType,
  CreateCategoryData,
} from '@/types/category-types';
