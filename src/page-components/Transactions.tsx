'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
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
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import {
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Filter,
  Loader2,
} from 'lucide-react';

const transactionSchema = z.object({
  account_id: z.string().min(1, 'Please select an account'),
  category_id: z.string().optional(),
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().max(255).optional(),
  date: z.string().min(1, 'Please select a date'),
});

const Transactions = () => {
  const { transactions, isLoading, createTransaction, deleteTransaction } = useTransactions();
  const { accounts } = useAccounts();
  const { incomeCategories, expenseCategories } = useCategories();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.categories?.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'all' || t.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [transactions, searchQuery, typeFilter]);

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

  const handleDelete = async () => {
    if (!selectedTransaction) return;
    await deleteTransaction.mutateAsync(selectedTransaction);
    setDeleteDialogOpen(false);
    setSelectedTransaction(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold">Transactions</h1>
            <p className="text-muted-foreground">Track your income and expenses</p>
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
                      type === 'expense' ? 'bg-destructive text-destructive-foreground' : 'bg-muted'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => { setType('income'); setCategoryId(''); }}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      type === 'income' ? 'bg-success text-success-foreground' : 'bg-muted'
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

        {/* Filters */}
        <Card className="shadow-card border-0">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter size={16} className="mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display">
              {filteredTransactions.length} Transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="mb-2">No transactions found.</p>
                {transactions.length === 0 && (
                  <Button variant="outline" onClick={() => setDialogOpen(true)}>
                    Add your first transaction
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${t.categories?.color || (t.type === 'income' ? '#10B981' : '#EF4444')}15` }}
                      >
                        {t.type === 'income' ? (
                          <ArrowUpRight style={{ color: t.categories?.color || '#10B981' }} size={24} />
                        ) : (
                          <ArrowDownRight style={{ color: t.categories?.color || '#EF4444' }} size={24} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{t.description || t.categories?.name || 'Transaction'}</p>
                        <p className="text-sm text-muted-foreground">
                          {t.accounts?.name} • {format(new Date(t.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-lg font-semibold ${t.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                      </span>
                      <button
                        onClick={() => { setSelectedTransaction(t.id); setDeleteDialogOpen(true); }}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The transaction will be permanently deleted and your account balance will be updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Transactions;
