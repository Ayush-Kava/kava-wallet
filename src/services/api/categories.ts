import { supabase } from '@/integrations/supabase/client';
import type { Category, CreateCategoryData } from '@/types/category-types';

export const categoriesApi = {
  getCategories: async (userId: string): Promise<Category[]> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${userId},is_default.eq.true`)
      .order('name');

    if (error) throw error;
    return data as Category[];
  },

  createCategory: async (
    userId: string,
    newCategory: CreateCategoryData,
  ): Promise<Category> => {
    const { data, error } = await supabase
      .from('categories')
      .insert([
        {
          user_id: userId,
          name: newCategory.name,
          type: newCategory.type,
          color: newCategory.color,
          icon: newCategory.icon,
          is_default: false,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  },
};
