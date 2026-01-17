'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { z } from 'zod';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
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
import { CreateCategoryDialog } from '@/components/molecules/common/CreateCategoryDialog';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { Loader2, Plus } from 'lucide-react';

const transactionSchema = z.object({
  account_id: z.string().min(1, 'Please select an account'),
  category_id: z.string().optional(),
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().max(255).optional(),
  date: z.string().min(1, 'Please select a date'),
});

export default function NewTransactionPage() {
  const { createTransaction } = useTransactions();
  const { accounts } = useAccounts();
  const { incomeCategories, expenseCategories } = useCategories();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);

  const categories = useMemo(
    () => (type === 'income' ? incomeCategories : expenseCategories),
    [type, incomeCategories, expenseCategories],
  );

  const resetForm = () => {
    setType('expense');
    setAccountId('');
    setCategoryId('');
    setAmount('');
    setDescription('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setFormErrors({});
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'create_new') {
      setCreateCategoryOpen(true);
    } else {
      setCategoryId(value);
    }
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
    resetForm();
  };

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="New Transaction"
        description="Add income or expense without opening a modal."
      >
        <div className="space-y-6">
          <Card className="shadow-card border-border/70">
            <CardHeader>
              <CardTitle className="font-display">
                Transaction Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex rounded-lg overflow-hidden border-2 border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setType('expense');
                      setCategoryId('');
                    }}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      type === 'expense'
                        ? 'bg-destructive text-destructive-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setType('income');
                      setCategoryId('');
                    }}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      type === 'income'
                        ? 'bg-success text-success-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    Income
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {formErrors.account_id && (
                      <p className="text-sm text-destructive">
                        {formErrors.account_id}
                      </p>
                    )}
                    {accounts.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Please create an account first in the Accounts page.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={categoryId}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category">
                          {categoryId &&
                            categories.find((c) => c.id === categoryId) && (
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{
                                    backgroundColor:
                                      categories.find(
                                        (c) => c.id === categoryId,
                                      )?.color || '#6366F1',
                                  }}
                                />
                                {
                                  categories.find((c) => c.id === categoryId)
                                    ?.name
                                }
                              </div>
                            )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="create_new"
                          className="font-medium text-primary cursor-pointer hover:bg-primary/10"
                        >
                          <div className="flex items-center gap-2">
                            <Plus size={14} />
                            Create New Category
                          </div>
                        </SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor: cat.color || '#6366F1',
                                }}
                              />
                              <span>{cat.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {formErrors.amount && (
                      <p className="text-sm text-destructive">
                        {formErrors.amount}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                    {formErrors.date && (
                      <p className="text-sm text-destructive">
                        {formErrors.date}
                      </p>
                    )}
                  </div>
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

                <Button
                  type="submit"
                  className="w-full md:w-auto"
                  disabled={isSubmitting || accounts.length === 0}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    'Save Transaction'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <CreateCategoryDialog
          open={createCategoryOpen}
          onOpenChange={setCreateCategoryOpen}
          type={type}
          onCategoryCreated={(id) => setCategoryId(id)}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
