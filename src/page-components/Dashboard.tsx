'use client'; 

import { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { z } from 'zod';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import Link from 'next/link';

const transactionSchema = z.object({
  account_id: z.string().min(1, 'Please select an account'),
  category_id: z.string().optional(),
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().max(255).optional(),
  date: z.string().min(1, 'Please select a date'),
});

const Dashboard = () => {
  const { transactions, createTransaction } = useTransactions();
  const { accounts, totalBalance } = useAccounts();
  const { incomeCategories, expenseCategories } = useCategories();

  // Transaction form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const resetForm = () => {
    setType('expense');
    setAccountId('');
    setCategoryId('');
    setAmount('');
    setDescription('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const result = transactionSchema.safeParse({
      account_id: accountId,
      category_id: categoryId || undefined,
      type,
      amount: parseFloat(amount),
      description: description || undefined,
      date,
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
    await createTransaction.mutateAsync(result.data);
    setIsSubmitting(false);
    setDialogOpen(false);
    resetForm();
  };

  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const monthTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date >= start && date <= end;
    });

    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Net savings = Total balance (which already reflects all transactions)
    // OR if we want monthly: income - expenses for the month
    // The balance already accounts for initial deposits and all transactions
    const savings = totalBalance;

    return { income, expenses, savings };
  }, [transactions, totalBalance]);

  const chartData = useMemo(() => {
    const months: { name: string; income: number; expenses: number }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);

      const monthTransactions = transactions.filter((t) => {
        const date = new Date(t.date);
        return date >= start && date <= end;
      });

      const income = monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expenses = monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      months.push({
        name: format(monthDate, 'MMM'),
        income,
        expenses,
      });
    }

    return months;
  }, [transactions]);

  const categoryData = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const monthExpenses = transactions.filter((t) => {
      const date = new Date(t.date);
      return t.type === 'expense' && date >= start && date <= end;
    });

    const byCategory: Record<string, { name: string; value: number; color: string }> = {};

    monthExpenses.forEach((t) => {
      const categoryName = t.categories?.name || 'Uncategorized';
      const color = t.categories?.color || '#64748B';

      if (!byCategory[categoryName]) {
        byCategory[categoryName] = { name: categoryName, value: 0, color };
      }
      byCategory[categoryName].value += Number(t.amount);
    });

    return Object.values(byCategory).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [transactions]);

  const recentTransactions = transactions.slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here&apos;s your financial overview.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={18} /> Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-display">New Transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Toggle */}
                <div className="flex rounded-lg overflow-hidden border-2 border-border">
                  <button
                    type="button"
                    onClick={() => { setType('expense'); setCategoryId(''); }}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      type === 'expense' ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-foreground'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => { setType('income'); setCategoryId(''); }}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      type === 'income' ? 'bg-success text-success-foreground' : 'bg-muted text-foreground'
                    }`}
                  >
                    Income
                  </button>
                </div>

                <div className="space-y-2">
                  <Label>Account *</Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.account_id && <p className="text-sm text-destructive">{formErrors.account_id}</p>}
                  {accounts.length === 0 && (
                    <p className="text-sm text-muted-foreground">Please create an account first in the Accounts page.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category">
                        {categoryId && categories.find(c => c.id === categoryId) && (
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: categories.find(c => c.id === categoryId)?.color || '#6366F1' }}
                            />
                            {categories.find(c => c.id === categoryId)?.name}
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: cat.color || '#6366F1' }}
                            />
                            <span>{cat.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  {formErrors.amount && <p className="text-sm text-destructive">{formErrors.amount}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="What was this for?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={255}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  {formErrors.date && <p className="text-sm text-destructive">{formErrors.date}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting || accounts.length === 0}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'Add Transaction'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-card border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-2xl font-bold font-display">{formatCurrency(totalBalance)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Wallet className="text-primary-foreground" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Income</p>
                  <p className="text-2xl font-bold font-display text-success">
                    {formatCurrency(currentMonthStats.income)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <TrendingUp className="text-success" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Expenses</p>
                  <p className="text-2xl font-bold font-display text-destructive">
                    {formatCurrency(currentMonthStats.expenses)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <TrendingDown className="text-destructive" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Savings</p>
                  <p className={`text-2xl font-bold font-display ${currentMonthStats.savings >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(currentMonthStats.savings)}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentMonthStats.savings >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  {currentMonthStats.savings >= 0 ? (
                    <ArrowUpRight className="text-success" size={24} />
                  ) : (
                    <ArrowDownRight className="text-destructive" size={24} />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Income vs Expenses Chart */}
          <Card className="lg:col-span-2 shadow-card border-0">
            <CardHeader>
              <CardTitle className="font-display">Income vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="hsl(var(--success))"
                      fillOpacity={1}
                      fill="url(#incomeGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke="hsl(var(--destructive))"
                      fillOpacity={1}
                      fill="url(#expenseGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="font-display">Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {categoryData.slice(0, 4).map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-muted-foreground">{cat.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(cat.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions & Accounts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <Card className="shadow-card border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display">Recent Transactions</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/transactions">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No transactions yet.</p>
                  <Button variant="link" asChild>
                    <Link href="/transactions">Add your first transaction</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${t.categories?.color || '#6366F1'}20` }}
                        >
                          {t.type === 'income' ? (
                            <ArrowUpRight style={{ color: t.categories?.color || '#10B981' }} />
                          ) : (
                            <ArrowDownRight style={{ color: t.categories?.color || '#EF4444' }} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{t.description || t.categories?.name || 'Transaction'}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(t.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-semibold ${t.type === 'income' ? 'text-success' : 'text-destructive'}`}
                      >
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Accounts */}
          <Card className="shadow-card border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display">Your Accounts</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/accounts">Manage</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No accounts yet.</p>
                  <Button variant="link" asChild>
                    <Link href="/accounts">Add your first account</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${acc.color}20` }}
                        >
                          <Wallet style={{ color: acc.color }} size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{acc.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{acc.type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <span className={`font-semibold ${Number(acc.balance) >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                        {formatCurrency(Number(acc.balance))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
