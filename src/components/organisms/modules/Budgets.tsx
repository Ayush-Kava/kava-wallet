'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { z } from 'zod';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCategories } from '@/hooks/useCategories';
import { useSummaryTransactions } from '@/hooks/useSummaryTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import type { Budget } from '@/types/budget-types';
import { Plus, Target, AlertTriangle, CheckCircle2, Trash2, Loader2, Pencil } from 'lucide-react';
import { CategoryOption } from '@/components/molecules/categories/CategoryOption';
import { CategoryIcon } from '@/components/molecules/categories/CategoryIcon';
import { uuidSchema } from '@/lib/validation/common';

const budgetSchema = z.object({
  category_id: uuidSchema,
  amount: z.number().positive('Amount must be positive'),
  period: z.enum(['monthly', 'yearly']),
});

const Budgets = () => {
  const { expenseCategories } = useCategories();
  const { transactions } = useSummaryTransactions();
  const { budgets, isLoading, createBudget, updateBudget, deleteBudget, isCreatingBudget, isUpdatingBudget } =
    useBudgets();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const now = useMemo(() => new Date(), []);

  const budgetProgress = useMemo(() => {
    if (!budgets.length) return {};

    const now = new Date();

    const result: Record<
      string,
      {
        spent: number;
        percentage: number;
        status: 'ok' | 'warning' | 'exceeded';
      }
    > = {};

    budgets.forEach(budget => {
      const periodStart =
        budget.period === 'yearly' ? startOfYear(now) : startOfMonth(now);
      const periodEnd = budget.period === 'yearly' ? endOfYear(now) : endOfMonth(now);

      const categoryTransactions = transactions.filter(t => {
        if (t.type !== 'expense' || t.transfer_id) return false;
        if (t.category_id !== budget.category_id) return false;
        const date = new Date(t.date);
        return date >= periodStart && date <= periodEnd;
      });

      const spent = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const percentage = (spent / Number(budget.amount)) * 100;

      let status: 'ok' | 'warning' | 'exceeded' = 'ok';
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= 80) status = 'warning';

      result[budget.id] = {
        spent,
        percentage: Math.min(percentage, 100),
        status,
      };
    });

    return result;
  }, [budgets, transactions]);

  const resetForm = () => {
    setCategoryId('');
    setAmount('');
    setPeriod('monthly');
    setFormErrors({});
    setEditingBudget(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (budget: Budget) => {
    setEditingBudget(budget);
    setCategoryId(budget.category_id ?? '');
    setAmount(String(budget.amount));
    setPeriod(budget.period as 'monthly' | 'yearly');
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const result = budgetSchema.safeParse({
      category_id: categoryId,
      amount: parseFloat(amount),
      period,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setFormErrors(errors);
      return;
    }

    const submitNow = new Date();
    const startDate =
      result.data.period === 'yearly'
        ? format(startOfYear(submitNow), 'yyyy-MM-dd')
        : format(startOfMonth(submitNow), 'yyyy-MM-dd');

    if (editingBudget) {
      await updateBudget(editingBudget.id, {
        amount: result.data.amount,
        period: result.data.period,
        start_date: startDate,
      });
    } else {
      await createBudget({
        ...result.data,
        start_date: startDate,
      });
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteBudget(id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const usedCategories = budgets?.map(b => b.category_id) || [];
  const availableCategories = expenseCategories.filter(c => !usedCategories.includes(c.id));
  const selectedBudgetCategory = availableCategories.find(c => c.id === categoryId);

  return (
    <DashboardLayout
      title="Budgets"
      description="Set and manage your spending limits"
      actions={
        <Button
          onClick={openCreateDialog}
          disabled={availableCategories.length === 0 && !editingBudget}
          className="inline-flex items-center gap-2"
        >
          <Plus size={18} /> New Budget
        </Button>
      }
    >
      <div className="space-y-6">
        <Dialog
          open={dialogOpen}
          onOpenChange={open => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingBudget ? 'Edit Budget' : 'Create Budget'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingBudget && (
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      {selectedBudgetCategory ? (
                        <CategoryOption
                          className="min-w-0 flex-1"
                          name={selectedBudgetCategory.name}
                          icon={selectedBudgetCategory.icon}
                          color={selectedBudgetCategory.color}
                        />
                      ) : (
                        <SelectValue placeholder="Select category" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <CategoryOption name={cat.name} icon={cat.icon} color={cat.color} />
                      </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.category_id && (
                    <p className="text-sm text-destructive">{formErrors.category_id}</p>
                  )}
                </div>
              )}

              {editingBudget && (
                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
                    <CategoryOption
                      name={editingBudget.categories?.name || ''}
                      icon={editingBudget.categories?.icon || 'circle'}
                      color={editingBudget.categories?.color || '#6366F1'}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
                {formErrors.amount && (
                  <p className="text-sm text-destructive">{formErrors.amount}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Period *</Label>
                <Select value={period} onValueChange={v => setPeriod(v as 'monthly' | 'yearly')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.period && (
                  <p className="text-sm text-destructive">{formErrors.period}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isCreatingBudget || isUpdatingBudget}>
                {isCreatingBudget || isUpdatingBudget ? (
                  <Loader2 className="animate-spin" />
                ) : editingBudget ? (
                  'Save Changes'
                ) : (
                  'Create Budget'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="font-display">Budgets</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : budgets.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p className="mb-2">No budgets yet.</p>
                <p className="mb-4">Create your first budget to start tracking.</p>
                <Button onClick={openCreateDialog}>
                  <Plus size={18} /> New Budget
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {budgets.map(budget => {
                  const progress = budgetProgress[budget.id] || {
                    spent: 0,
                    percentage: 0,
                    status: 'ok' as const,
                  };
                  const remaining = Number(budget.amount) - progress.spent;

                  return (
                    <div
                      key={budget.id}
                      className="group rounded-xl border border-border p-4 transition-all hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {budget.categories ? (
                            <CategoryIcon
                              icon={budget.categories.icon}
                              color={budget.categories.color}
                              name={budget.categories.name}
                              size="md"
                            />
                          ) : (
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-lg"
                              style={{ backgroundColor: '#6366F120' }}
                            >
                              <Target style={{ color: '#6366F1' }} size={20} />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">{budget.categories?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {budget.period === 'yearly'
                                ? format(now, 'yyyy')
                                : format(now, 'MMM yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {progress.status === 'exceeded' && (
                            <AlertTriangle className="text-destructive" size={20} />
                          )}
                          {progress.status === 'warning' && (
                            <AlertTriangle className="text-warning" size={20} />
                          )}
                          {progress.status === 'ok' && progress.percentage > 0 && (
                            <CheckCircle2 className="text-success" size={20} />
                          )}
                          <button
                            onClick={() => openEditDialog(budget)}
                            className="rounded-lg p-2 text-muted-foreground opacity-0 transition-all hover:bg-muted group-hover:opacity-100"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(budget.id)}
                            className="rounded-lg p-2 text-destructive opacity-0 transition-all hover:bg-destructive/10 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {formatCurrency(progress.spent)} spent
                          </span>
                          <span className="font-medium">
                            {formatCurrency(Number(budget.amount))}
                          </span>
                        </div>
                        <Progress
                          value={progress.percentage}
                          className={`h-2 ${
                            progress.status === 'exceeded'
                              ? '[&>div]:bg-destructive'
                              : progress.status === 'warning'
                                ? '[&>div]:bg-warning'
                                : '[&>div]:bg-success'
                          }`}
                        />
                        <p className="text-sm text-muted-foreground">
                          {progress.status === 'exceeded'
                            ? `Over by ${formatCurrency(progress.spent - Number(budget.amount))}`
                            : `${formatCurrency(remaining)} remaining`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Budgets;
