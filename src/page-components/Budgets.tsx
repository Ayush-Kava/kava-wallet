'use client';

import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { z } from 'zod';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {  Progress } from '@/components/ui/progress';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/use-toast';
import { Plus, Target, AlertTriangle, CheckCircle2, Loader2, Trash2 } from 'lucide-react';

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

  // Form state
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*, categories(name, color, icon)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!user,
  });

  const createBudget = useMutation({
    mutationFn: async (data: z.infer<typeof budgetSchema>) => {
      const now = new Date();
      const startDate = startOfMonth(now);
      
      const { error } = await supabase.from('budgets').insert({
        ...data,
        user_id: user!.id,
        start_date: format(startDate, 'yyyy-MM-dd'),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Budget created!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating budget', description: error.message, variant: 'destructive' });
    },
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);
      if (error) throw error;
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

    const result: Record<string, { spent: number; percentage: number; status: 'ok' | 'warning' | 'exceeded' }> = {};

    budgets.forEach((budget) => {
      const categoryTransactions = transactions.filter((t) => {
        if (t.type !== 'expense') return false;
        if (t.category_id !== budget.category_id) return false;
        const date = new Date(t.date);
        return date >= monthStart && date <= monthEnd;
      });

      const spent = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const percentage = (spent / Number(budget.amount)) * 100;
      
      let status: 'ok' | 'warning' | 'exceeded' = 'ok';
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= 80) status = 'warning';

      result[budget.id] = { spent, percentage: Math.min(percentage, 100), status };
    });

    return result;
  }, [budgets, transactions]);

  const resetForm = () => {
    setCategoryId('');
    setAmount('');
    setPeriod('monthly');
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const usedCategories = budgets?.map((b) => b.category_id) || [];
  const availableCategories = expenseCategories.filter((c) => !usedCategories.includes(c.id));

  const exceededBudgets = budgets?.filter((b) => budgetProgress[b.id]?.status === 'exceeded') || [];
  const warningBudgets = budgets?.filter((b) => budgetProgress[b.id]?.status === 'warning') || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold">Budgets</h1>
            <p className="text-muted-foreground">Set spending limits for each category</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button disabled={availableCategories.length === 0}>
                <Plus size={18} /> New Budget
              </Button>
            </DialogTrigger>
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
                  {formErrors.category_id && <p className="text-sm text-destructive">{formErrors.category_id}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Budget Amount *</Label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="100"
                  />
                  {formErrors.amount && <p className="text-sm text-destructive">{formErrors.amount}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Period *</Label>
                  <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'Create Budget'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Alerts */}
        {exceededBudgets.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-destructive" size={24} />
                <div>
                  <p className="font-semibold text-destructive">Budget Exceeded!</p>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ve exceeded your budget for: {exceededBudgets.map((b) => b.categories?.name).join(', ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {warningBudgets.length > 0 && exceededBudgets.length === 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-warning" size={24} />
                <div>
                  <p className="font-semibold text-warning">Approaching Budget Limit</p>
                  <p className="text-sm text-muted-foreground">
                    You&apos;re at 80%+ of your budget for: {warningBudgets.map((b) => b.categories?.name).join(', ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Budgets Grid */}
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display">Your Budgets</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : !budgets || budgets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Target size={48} className="mx-auto mb-4 opacity-50" />
                <p className="mb-4">No budgets set. Create your first budget to track your spending.</p>
                <Button onClick={() => setDialogOpen(true)} disabled={availableCategories.length === 0}>
                  <Plus size={18} /> Create Budget
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgets.map((budget) => {
                  const progress = budgetProgress[budget.id] || { spent: 0, percentage: 0, status: 'ok' };
                  const remaining = Math.max(0, Number(budget.amount) - progress.spent);

                  return (
                    <div
                      key={budget.id}
                      className="p-4 rounded-xl border border-border hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${budget.categories?.color || '#6366F1'}20` }}
                          >
                            <Target style={{ color: budget.categories?.color || '#6366F1' }} size={20} />
                          </div>
                          <div>
                            <p className="font-semibold">{budget.categories?.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">{budget.period}</p>
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
                            onClick={() => deleteBudget.mutate(budget.id)}
                            className="p-2 rounded-lg hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
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
                            : `${formatCurrency(remaining)} remaining`
                          }
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
