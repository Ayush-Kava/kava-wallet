'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import {
  CategoryFormFields,
  type CategoryFormValues,
} from '@/components/molecules/categories/CategoryFormFields';
import {
  categoryIconForMode,
  getCategoryDisplayMode,
} from '@/lib/category-display';
import type { Category, CategoryType, CreateCategoryData } from '@/types/category-types';
import { Loader2 } from 'lucide-react';

const categoryFormSchema = z
  .object({
    name: z.string().min(1, 'Category name is required'),
    displayMode: z.enum(['color', 'emoji']),
    color: z.string(),
    emoji: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.displayMode === 'emoji' && !data.emoji) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['emoji'],
        message: 'Emoji is required',
      });
    }
  });

function buildFormState(category?: Category): CategoryFormValues {
  if (!category) {
    return {
      name: '',
      displayMode: 'color',
      color: '#6366F1',
      emoji: '🛒',
    };
  }

  const displayMode = getCategoryDisplayMode(category.icon);
  return {
    name: category.name,
    displayMode,
    color: category.color,
    emoji: displayMode === 'emoji' ? category.icon : '🛒',
  };
}

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: CategoryType;
  mode: 'create' | 'edit';
  initialCategory?: Category;
  onSubmit: (data: CreateCategoryData) => Promise<void>;
  isSubmitting?: boolean;
}

function CategoryFormBody({
  type,
  mode,
  initialCategory,
  onSubmit,
  onClose,
  isSubmitting,
}: {
  type: CategoryType;
  mode: 'create' | 'edit';
  initialCategory?: Category;
  onSubmit: (data: CreateCategoryData) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
}) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: buildFormState(initialCategory),
  });

  useEffect(() => {
    form.reset(buildFormState(initialCategory));
  }, [initialCategory, form]);

  const handleSubmit = async (values: CategoryFormValues) => {
    await onSubmit({
      name: values.name.trim(),
      type,
      color: values.color,
      icon: categoryIconForMode(values.displayMode, values.emoji),
    });
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <CategoryFormFields control={form.control} disabled={isSubmitting} />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === 'create' ? (
              'Create Category'
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  type,
  mode,
  initialCategory,
  onSubmit,
  isSubmitting = false,
}: CategoryFormDialogProps) {
  const formKey = `${mode}-${type}-${initialCategory?.id ?? 'new'}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,40rem)] overflow-y-auto sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create' : 'Edit'}{' '}
            {type === 'income' ? 'Income' : 'Expense'} Category
          </DialogTitle>
          <DialogDescription>
            Choose a color dot or emoji to make your categories easy to spot.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <CategoryFormBody
            key={formKey}
            type={type}
            mode={mode}
            initialCategory={initialCategory}
            onSubmit={onSubmit}
            onClose={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
