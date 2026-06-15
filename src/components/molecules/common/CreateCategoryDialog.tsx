import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { CategoryFormFields } from '@/components/molecules/categories/CategoryFormFields';
import {
  categoryIconForMode,
  type CategoryDisplayMode,
} from '@/lib/category-display';

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
  const [name, setName] = useState('');
  const [displayMode, setDisplayMode] = useState<CategoryDisplayMode>('color');
  const [color, setColor] = useState('#6366F1');
  const [emoji, setEmoji] = useState('🛒');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      const newCategory = await createCategory.mutateAsync({
        name: name.trim(),
        type,
        color,
        icon: categoryIconForMode(displayMode, emoji),
      });
      onCategoryCreated(newCategory.id);
      onClose();
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setIsCreating(false);
    }
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
        disabled={isCreating}
      />
      <Button
        type="submit"
        className="w-full"
        disabled={isCreating || !name.trim() || (displayMode === 'emoji' && !emoji)}
      >
        {isCreating ? <Loader2 className="animate-spin" /> : 'Create Category'}
      </Button>
    </form>
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
