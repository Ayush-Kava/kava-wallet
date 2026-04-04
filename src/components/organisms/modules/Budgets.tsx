'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/useToast';
import { apiFetch } from '@/lib/api-client';
import {
  Plus,
  Target,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Loader2,
} from 'lucide-react';

interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  period: 'monthly' | 'yearly';
  start_date: string;
  end_date: string | null;
  created_at: string;
  categories?: { name: string; color: string; icon: string };
}

const budgetSchema = z.object({
  category_id: z.string().min(1, 'Please select a category'),
  amount: z.number().positive('Amount must be positive'),
  period: z.enum(['monthly', 'yearly']),
});

const Budgets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { expenseCategories } = useCategories();
  const { transactions } = useTransactions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets', user?.id],
    queryFn: async () => {
      return apiFetch<Budget[]>(`/api/budgets`);
    },
    enabled: !!user,
  });

  const createBudget = useMutation({
    mutationFn: async (data: z.infer<typeof budgetSchema>) => {
      const now = new Date();
      const startDate = startOfMonth(now);
      await apiFetch<void>(`/api/budgets`, 'POST', {
        ...data,
        user_id: user!.id,
        start_date: format(startDate, 'yyyy-MM-dd'),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Budget created!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating budget',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch<void>(`/api/budgets/${id}`, 'DELETE', {
        user_id: user!.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Budget deleted!' });
    },
  });

  const budgetProgress = useMemo(() => {
    if (!budgets) return {};

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const result: Record<
      string,
      {
        spent: number;
        percentage: number;
        status: 'ok' | 'warning' | 'exceeded';
      }
    > = {};

    budgets.forEach((budget) => {
      const categoryTransactions = transactions.filter((t) => {
        if (t.type !== 'expense') return false;
        if (t.category_id !== budget.category_id) return false;
        const date = new Date(t.date);
        return date >= monthStart && date <= monthEnd;
      });

      const spent = categoryTransactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0,
      );
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
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    await createBudget.mutateAsync(result.data);
    setIsSubmitting(false);
    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteBudget.mutateAsync(id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const usedCategories = budgets?.map((b) => b.category_id) || [];
  const availableCategories = expenseCategories.filter(
    (c) => !usedCategories.includes(c.id),
  );

  return (
    <DashboardLayout
      title="Budgets"
      description="Set and manage your spending limits"
      actions={
        <Button
          onClick={() => setDialogOpen(true)}
          disabled={availableCategories.length === 0}
          className="inline-flex items-center gap-2"
        >
          <Plus size={18} /> New Budget
        </Button>
      }
    >
      <div className="space-y-6">
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-display">Create Budget</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.category_id && (
                  <p className="text-sm text-destructive">
                    {formErrors.category_id}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {formErrors.amount && (
                  <p className="text-sm text-destructive">
                    {formErrors.amount}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Period *</Label>
                <Select
                  value={period}
                  onValueChange={(v) => setPeriod(v as 'monthly' | 'yearly')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.period && (
                  <p className="text-sm text-destructive">
                    {formErrors.period}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  'Create Budget'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display">Budgets</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading || !budgets ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : budgets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="mb-2">No budgets yet.</p>
                <p className="mb-4">
                  Create your first budget to start tracking.
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus size={18} /> New Budget
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgets.map((budget) => {
                  const progress = budgetProgress[budget.id] || {
                    spent: 0,
                    percentage: 0,
                    status: 'ok' as const,
                  };
                  const remaining = Number(budget.amount) - progress.spent;

                  return (
                    <div
                      key={budget.id}
                      className="p-4 rounded-xl border border-border group hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: `${
                                budget.categories?.color || '#6366F1'
                              }20`,
                            }}
                          >
                            <Target
                              style={{
                                color: budget.categories?.color || '#6366F1',
                              }}
                              size={20}
                            />
                          </div>
                          <div>
                            <p className="font-semibold">
                              {budget.categories?.name}
                            </p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {budget.period}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {progress.status === 'exceeded' && (
                            <AlertTriangle
                              className="text-destructive"
                              size={20}
                            />
                          )}
                          {progress.status === 'warning' && (
                            <AlertTriangle className="text-warning" size={20} />
                          )}
                          {progress.status === 'ok' &&
                            progress.percentage > 0 && (
                              <CheckCircle2
                                className="text-success"
                                size={20}
                              />
                            )}
                          <button
                            onClick={() => handleDelete(budget.id)}
                            className="p-2 rounded-lg hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 mt-4">
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
                            ? `Over by ${formatCurrency(
                                progress.spent - Number(budget.amount),
                              )}`
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
