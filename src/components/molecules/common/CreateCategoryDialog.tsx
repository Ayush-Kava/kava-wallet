import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import {
  CategoryFormFields,
  type CategoryFormValues,
} from '@/components/molecules/categories/CategoryFormFields';
import { categoryIconForMode } from '@/lib/category-display';

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

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'income' | 'expense';
  onCategoryCreated: (categoryId: string) => void;
}

function CreateCategoryForm({
  type,
  onCategoryCreated,
  onClose,
}: {
  type: 'income' | 'expense';
  onCategoryCreated: (categoryId: string) => void;
  onClose: () => void;
}) {
  const { createCategory } = useCategories();
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      displayMode: 'color',
      color: '#6366F1',
      emoji: '🛒',
    },
  });

  const handleSubmit = async (values: CategoryFormValues) => {
    try {
      const newCategory = await createCategory.mutateAsync({
        name: values.name.trim(),
        type,
        color: values.color,
        icon: categoryIconForMode(values.displayMode, values.emoji),
      });
      onCategoryCreated(newCategory.id);
      onClose();
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <CategoryFormFields control={form.control} disabled={createCategory.isPending} />
        <Button type="submit" className="w-full" disabled={createCategory.isPending}>
          {createCategory.isPending ? <Loader2 className="animate-spin" /> : 'Create Category'}
        </Button>
      </form>
    </Form>
  );
}

export function CreateCategoryDialog({
  open,
  onOpenChange,
  type,
  onCategoryCreated,
}: CreateCategoryDialogProps) {
  const [session, setSession] = useState(0);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) setSession(s => s + 1);
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[min(90vh,40rem)] overflow-y-auto sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create {type === 'income' ? 'Income' : 'Expense'} Category</DialogTitle>
        </DialogHeader>
        {open && (
          <CreateCategoryForm
            key={`${type}-${session}`}
            type={type}
            onCategoryCreated={onCategoryCreated}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
