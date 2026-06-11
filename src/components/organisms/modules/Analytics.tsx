'use client';

import { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSummaryTransactions } from '@/hooks/useSummaryTransactions';
import { ChartTooltipContent } from '@/components/molecules/common/ChartTooltipContent';
import { useAccounts } from '@/hooks/useAccounts';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Calendar } from 'lucide-react';

type Period = 'month' | 'year';

const Analytics = () => {
  const { transactions } = useSummaryTransactions();
  const { totalBalance } = useAccounts();
  const [period, setPeriod] = useState<Period>('month');

  const dateRange = useMemo(() => {
    const now = new Date();
    if (period === 'month') {
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: format(now, 'MMMM yyyy'),
      };
    }
    return {
      start: startOfYear(now),
      end: endOfYear(now),
      label: format(now, 'yyyy'),
    };
  }, [period]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = new Date(t.date);
      return date >= dateRange.start && date <= dateRange.end;
    });
  }, [transactions, dateRange]);

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const savings = totalBalance;
    const totalAvailable = income > 0 ? income : totalBalance + expenses;
    const savingsRate = totalAvailable > 0 ? (savings / totalAvailable) * 100 : 0;

    return { income, expenses, savings, savingsRate };
  }, [filteredTransactions, totalBalance]);

  const expenseByCategory = useMemo(() => {
    const byCategory: Record<string, { name: string; value: number; color: string }> = {};

    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const name = t.categories?.name || 'Uncategorized';
        const color = t.categories?.color || '#64748B';
        if (!byCategory[name]) byCategory[name] = { name, value: 0, color };
        byCategory[name].value += Number(t.amount);
      });

    return Object.values(byCategory).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const incomeByCategory = useMemo(() => {
    const byCategory: Record<string, { name: string; value: number; color: string }> = {};

    filteredTransactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        const name = t.categories?.name || 'Other Income';
        const color = t.categories?.color || '#10B981';
        if (!byCategory[name]) byCategory[name] = { name, value: 0, color };
        byCategory[name].value += Number(t.amount);
      });

    return Object.values(byCategory).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const monthlyTrend = useMemo(() => {
    const months: {
      name: string;
      income: number;
      expenses: number;
      savings: number;
    }[] = [];
    const numMonths = period === 'year' ? 12 : 6;

    for (let i = numMonths - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);

      const monthTx = transactions.filter(t => {
        const date = new Date(t.date);
        return date >= start && date <= end;
      });

      const income = monthTx
        .filter(t => t.type === 'income')
        .reduce((s, t) => s + Number(t.amount), 0);
      const expenses = monthTx
        .filter(t => t.type === 'expense')
        .reduce((s, t) => s + Number(t.amount), 0);

      months.push({
        name: format(monthDate, 'MMM'),
        income,
        expenses,
        savings: income - expenses,
      });
    }

    return months;
  }, [transactions, period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const periodToggle = (
    <div className="flex overflow-hidden rounded-lg border border-border">
      <button
        onClick={() => setPeriod('month')}
        className={`px-4 py-2 text-sm font-medium ${
          period === 'month' ? 'bg-primary text-primary-foreground' : 'bg-card'
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => setPeriod('year')}
        className={`px-4 py-2 text-sm font-medium ${
          period === 'year' ? 'bg-primary text-primary-foreground' : 'bg-card'
        }`}
      >
        Yearly
      </button>
    </div>
  );

  return (
    <DashboardLayout
      title="Analytics"
      description="Detailed insights into your financial activities"
      actions={periodToggle}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar size={18} />
          <span>{dateRange.label}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-card">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="font-display text-2xl font-bold text-success">
                {formatCurrency(stats.income)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="font-display text-2xl font-bold text-destructive">
                {formatCurrency(stats.expenses)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Net Savings</p>
              <p
                className={`font-display text-2xl font-bold ${
                  stats.savings >= 0 ? 'text-success' : 'text-destructive'
                }`}
              >
                {formatCurrency(stats.savings)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Savings Rate</p>
              <p
                className={`font-display text-2xl font-bold ${
                  stats.savingsRate >= 0 ? 'text-success' : 'text-destructive'
                }`}
              >
                {stats.savingsRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="font-display">Income vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#22c55e"
                      fillOpacity={1}
                      fill="url(#incomeGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke="#ef4444"
                      fillOpacity={1}
                      fill="url(#expenseGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="font-display">Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {expenseByCategory.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No expense data for this period
                </div>
              ) : (
                <>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {expenseByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 max-h-[150px] space-y-2 overflow-y-auto">
                    {expenseByCategory.map(cat => (
                      <div
                        key={cat.name}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <div
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="truncate text-muted-foreground">{cat.name}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(cat.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Income Sources */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="font-display">Income Sources</CardTitle>
            </CardHeader>
            <CardContent>
              {incomeByCategory.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No income data for this period
                </div>
              ) : (
                <>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incomeByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {incomeByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 max-h-[150px] space-y-2 overflow-y-auto">
                    {incomeByCategory.map(cat => (
                      <div
                        key={cat.name}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <div
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="truncate text-muted-foreground">{cat.name}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(cat.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
