'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CategoryIcon } from '@/components/molecules/categories/CategoryIcon';
import { CategoryFormDialog } from './CategoryFormDialog';
import { useCategories } from '@/hooks/useCategories';
import type { Category, CategoryType } from '@/types/category-types';
import { Plus, Pencil, Trash2, Loader2, Tag, Lock } from 'lucide-react';

function CategoryCard({
  category,
  editable,
  onEdit,
  onDelete,
}: {
  category: Category;
  editable: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CategoryIcon icon={category.icon} color={category.color} name={category.name} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{category.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px] capitalize">
                {category.type}
              </Badge>
              {!editable && (
                <Badge variant="outline" className="gap-1 text-[10px]">
                  <Lock className="h-3 w-3" />
                  Built-in
                </Badge>
              )}
            </div>
          </div>
        </div>
        {editable && (
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryGrid({
  categories,
  editable,
  onEdit,
  onDelete,
  emptyMessage,
}: {
  categories: Category[];
  editable: boolean;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  emptyMessage: string;
}) {
  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map(category => (
        <CategoryCard
          key={category.id}
          category={category}
          editable={editable}
          onEdit={onEdit ? () => onEdit(category) : undefined}
          onDelete={onDelete ? () => onDelete(category) : undefined}
        />
      ))}
    </div>
  );
}

export default function CategoriesPage() {
  const {
    categories,
    customCategories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  const [activeTab, setActiveTab] = useState<CategoryType>('expense');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const defaultCategories = categories.filter(c => c.is_default);

  const openCreate = () => {
    setFormMode('create');
    setEditingCategory(null);
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setFormMode('edit');
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: Parameters<typeof createCategory.mutateAsync>[0]) => {
    if (formMode === 'edit' && editingCategory) {
      await updateCategory.mutateAsync({
        id: editingCategory.id,
        data: { name: data.name, color: data.color, icon: data.icon },
      });
    } else {
      await createCategory.mutateAsync(data);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    await deleteCategory.mutateAsync(deletingCategory.id);
    setDeletingCategory(null);
  };

  return (
    <DashboardLayout
      title="Categories"
      description="Organize transactions with colors or emojis"
      actions={
        <Button onClick={openCreate} className="gap-2">
          <Plus size={18} />
          New Category
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border/70 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{categories.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Your own</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{customCategories.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Built-in</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{defaultCategories.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as CategoryType)}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="expense">Expense</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
          </TabsList>

          {(['expense', 'income'] as const).map(tab => {
            const customForTab = customCategories.filter(c => c.type === tab);
            const defaultForTab = defaultCategories.filter(c => c.type === tab);

            return (
            <TabsContent key={tab} value={tab} className="mt-6 space-y-8">
              {isLoading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading categories...
                </div>
              ) : (
                <>
                  <section className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h2 className="font-display text-lg font-semibold">Your categories</h2>
                        <p className="text-sm text-muted-foreground">
                          Fully customizable — edit name, color, or emoji anytime.
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={openCreate} className="gap-2">
                        <Plus size={16} />
                        Add
                      </Button>
                    </div>
                    <CategoryGrid
                      categories={customForTab}
                      editable
                      onEdit={openEdit}
                      onDelete={setDeletingCategory}
                      emptyMessage={`No custom ${tab} categories yet. Create one to get started.`}
                    />
                  </section>

                  <section className="space-y-4">
                    <div>
                      <h2 className="font-display text-lg font-semibold">Built-in categories</h2>
                      <p className="text-sm text-muted-foreground">
                        Ready-to-use defaults — create your own copy if you need a variant.
                      </p>
                    </div>
                    <CategoryGrid
                      categories={defaultForTab}
                      editable={false}
                      emptyMessage="No built-in categories for this type."
                    />
                  </section>
                </>
              )}
            </TabsContent>
            );
          })}
        </Tabs>

        <Card className="border-primary/20 bg-primary/5 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="h-4 w-4" />
              Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-inside list-disc space-y-1">
              <li>Use emojis for quick visual scanning (🛒 groceries, 🚗 transport).</li>
              <li>Use the color wheel for a consistent palette across charts and budgets.</li>
              <li>Categories with transactions or budgets cannot be deleted until unlinked.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        type={formMode === 'edit' && editingCategory ? editingCategory.type : activeTab}
        mode={formMode}
        initialCategory={editingCategory ?? undefined}
        onSubmit={handleFormSubmit}
        isSubmitting={createCategory.isPending || updateCategory.isPending}
      />

      <AlertDialog open={Boolean(deletingCategory)} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deletingCategory?.name}</strong>? This only works if no transactions
              or budgets use it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCategory.isPending ? <Loader2 className="animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
