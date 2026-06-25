import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { categoriesApi } from '@/services/api/categories';
import type { CreateCategoryData, UpdateCategoryData } from '@/types/category-types';

type UseCategoriesOptions = {
  /** When false, skips the list query (mutations still work). Default: true */
  enabled?: boolean;
};

export const useCategories = (options?: UseCategoriesOptions) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const listEnabled = (options?.enabled ?? true) && !!user;

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', user?.id],
    queryFn: () => categoriesApi.getCategories(),
    enabled: listEnabled,
  });

  const createCategory = useMutation({
    mutationFn: async (newCategory: CreateCategoryData) =>
      categoriesApi.createCategory(newCategory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCategoryData }) =>
      categoriesApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Category updated' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating category',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => categoriesApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Category deleted' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting category',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const incomeCategories = useMemo(
    () => categories?.filter(c => c.type === 'income') ?? [],
    [categories],
  );
  const expenseCategories = useMemo(
    () => categories?.filter(c => c.type === 'expense') ?? [],
    [categories],
  );

  const customCategories = useMemo(
    () => categories?.filter(c => !c.is_default) ?? [],
    [categories],
  );

  return {
    categories: categories || [],
    incomeCategories,
    expenseCategories,
    customCategories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};

export type { Category, CategoryType, CreateCategoryData, UpdateCategoryData } from '@/types/category-types';
