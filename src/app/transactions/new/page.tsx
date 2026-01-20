'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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

const transferSchema = z
  .object({
    from_account_id: z.string().min(1, 'Please select a source account'),
    to_account_id: z.string().min(1, 'Please select a destination account'),
    amount: z.number().positive('Amount must be positive'),
    description: z.string().max(255).optional(),
    date: z.string().min(1, 'Please select a date'),
  })
  .refine((data) => data.from_account_id !== data.to_account_id, {
    message: 'From and To accounts must be different',
    path: ['to_account_id'],
  });

function NewTransactionPageInner() {
  const { createTransaction, createTransfer } = useTransactions();
  const { accounts } = useAccounts();
  const { incomeCategories, expenseCategories } = useCategories();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<'transaction' | 'transfer'>(
    searchParams.get('type') === 'transfer' ? 'transfer' : 'transaction',
  );

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fromAccountId, setFromAccountId] = useState(
    searchParams.get('from') || '',
  );
  const [toAccountId, setToAccountId] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);

  const categories = useMemo(
    () => (type === 'income' ? incomeCategories : expenseCategories),
    [type, incomeCategories, expenseCategories],
  );

  useEffect(() => {
    const paramType = searchParams.get('type');
    if (paramType === 'transfer') {
      setMode('transfer');
    }

    const presetFrom = searchParams.get('from');
    if (presetFrom) {
      setFromAccountId(presetFrom);
    }

    const presetTo = searchParams.get('to');
    if (presetTo) {
      setToAccountId(presetTo);
    }
  }, [searchParams]);

  const resetForm = () => {
    setType('expense');
    setAccountId('');
    setCategoryId('');
    setAmount('');
    setDescription('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setFromAccountId(searchParams.get('from') || '');
    setToAccountId('');
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

    if (mode === 'transfer') {
      const result = transferSchema.safeParse({
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
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
      await createTransfer.mutateAsync(result.data);
      setIsSubmitting(false);
      resetForm();
      return;
    }

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
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">
          Loading transaction form…
        </div>
      }
    >
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
                        setMode('transaction');
                        setFormErrors({});
                      }}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        mode === 'transaction'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      Income / Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('transfer');
                        setFormErrors({});
                      }}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        mode === 'transfer'
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      Transfer
                    </button>
                  </div>

                  {mode === 'transaction' && (
                    <>
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
                          <Select
                            value={accountId}
                            onValueChange={setAccountId}
                          >
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
                              Please create an account first in the Accounts
                              page.
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
                                  categories.find(
                                    (c) => c.id === categoryId,
                                  ) && (
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
                                        categories.find(
                                          (c) => c.id === categoryId,
                                        )?.name
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
                    </>
                  )}

                  {mode === 'transfer' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>From Account *</Label>
                        <Select
                          value={fromAccountId}
                          onValueChange={setFromAccountId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select source account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((acc) => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.from_account_id && (
                          <p className="text-sm text-destructive">
                            {formErrors.from_account_id}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>To Account *</Label>
                        <Select
                          value={toAccountId}
                          onValueChange={setToAccountId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select destination account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((acc) => (
                              <SelectItem
                                key={acc.id}
                                value={acc.id}
                                disabled={acc.id === fromAccountId}
                              >
                                {acc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.to_account_id && (
                          <p className="text-sm text-destructive">
                            {formErrors.to_account_id}
                          </p>
                        )}
                        {accounts.length < 2 && (
                          <p className="text-sm text-muted-foreground">
                            You need at least two accounts to record a transfer.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

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
                    <Label>
                      {mode === 'transfer' ? 'Note' : 'Description'}
                    </Label>
                    <Input
                      placeholder={
                        mode === 'transfer'
                          ? 'Optional note for this transfer'
                          : 'What was this for?'
                      }
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={255}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full md:w-auto"
                    disabled={
                      isSubmitting ||
                      accounts.length === 0 ||
                      (mode === 'transfer' && accounts.length < 2)
                    }
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : mode === 'transfer' ? (
                      'Save Transfer'
                    ) : (
                      'Save Transaction'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {mode === 'transaction' && (
            <CreateCategoryDialog
              open={createCategoryOpen}
              onOpenChange={setCreateCategoryOpen}
              type={type}
              onCategoryCreated={(id) => setCategoryId(id)}
            />
          )}
        </DashboardLayout>
      </ProtectedRoute>
    </Suspense>
  );
}

export default function NewTransactionPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">
          Loading transaction form…
        </div>
      }
    >
      <NewTransactionPageInner />
    </Suspense>
  );
}
