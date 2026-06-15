'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CategoryFormFields } from '@/components/molecules/categories/CategoryFormFields';
import {
  categoryIconForMode,
  getCategoryDisplayMode,
  type CategoryDisplayMode,
} from '@/lib/category-display';
import type { Category, CategoryType, CreateCategoryData } from '@/types/category-types';
import { Loader2 } from 'lucide-react';

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: CategoryType;
  mode: 'create' | 'edit';
  initialCategory?: Category;
  onSubmit: (data: CreateCategoryData) => Promise<void>;
  isSubmitting?: boolean;
}

function buildFormState(category?: Category) {
  if (!category) {
    return {
      name: '',
      displayMode: 'color' as CategoryDisplayMode,
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
  const initial = buildFormState(initialCategory);
  const [name, setName] = useState(initial.name);
  const [displayMode, setDisplayMode] = useState<CategoryDisplayMode>(initial.displayMode);
  const [color, setColor] = useState(initial.color);
  const [emoji, setEmoji] = useState(initial.emoji);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (displayMode === 'emoji' && !emoji) return;

    await onSubmit({
      name: name.trim(),
      type,
      color,
      icon: categoryIconForMode(displayMode, emoji),
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <CategoryFormFields
        name={name}
        onNameChange={setName}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        color={color}
        onColorChange={setColor}
        emoji={emoji}
        onEmojiChange={setEmoji}
        disabled={isSubmitting}
      />
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !name.trim() || (displayMode === 'emoji' && !emoji)}
        >
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
