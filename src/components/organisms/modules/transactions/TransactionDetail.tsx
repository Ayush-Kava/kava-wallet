'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useTransactionById, useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatDateStr } from '@/lib/ledger-utils';
import { documentsApi } from '@/services/api/documents';
import type { Transaction } from '@/types/transaction-types';
import {
  ArrowLeft,
  Copy,
  Link as LinkIcon,
  Loader2,
  Pencil,
  Repeat,
  Trash2,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface TransactionDetailProps {
  transactionId: string;
}

interface EditFormState {
  type: 'income' | 'expense';
  accountId: string;
  categoryId: string;
  amount: string;
  description: string;
  date: string;
  fromAccountId: string;
  toAccountId: string;
}

const formatSignedAmount = (amount: number, type: 'income' | 'expense') => {
  const formatted = formatCurrency(amount);
  return `${type === 'income' ? '+' : '-'}${formatted}`;
};

const getDateInputValue = (value: string) => value.split('T')[0] || value;

export default function TransactionDetail({
  transactionId,
}: TransactionDetailProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { transaction, linkedTransactions, isLoading, refetch } =
    useTransactionById(transactionId);
  const { accounts } = useAccounts();
  const { incomeCategories, expenseCategories } = useCategories();
  const {
    updateTransaction,
    updateTransfer,
    deleteTransaction,
    duplicateTransaction,
  } = useTransactions(1, 7, undefined, { enableList: false });

  // Fetch linked documents for this transaction
  const { data: linkedDocuments = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['transaction-documents', transactionId, user?.id],
    queryFn: () =>
      documentsApi.getDocumentsByLinkedEntity(user!.id, transactionId),
    enabled: !!user && !!transactionId,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formState, setFormState] = useState<EditFormState>({
    type: 'expense',
    accountId: '',
    categoryId: '',
    amount: '',
    description: '',
    date: '',
    fromAccountId: '',
    toAccountId: '',
  });

  const isTransfer = Boolean(transaction?.transfer_id);

  const transferEntries = useMemo(() => {
    if (!transaction) return { income: undefined, expense: undefined };
    const entries = [transaction, ...linkedTransactions];
    return {
      income: entries.find((tx) => tx.type === 'income'),
      expense: entries.find((tx) => tx.type === 'expense'),
    } as { income?: Transaction; expense?: Transaction };
  }, [transaction, linkedTransactions]);

  const initializeForm = () => {
    if (!transaction) return;

    setFormErrors({});
    if (isTransfer) {
      setFormState({
        type: transaction.type,
        accountId: transaction.account_id,
        categoryId: transaction.category_id || '',
        amount: String(transaction.amount),
        description: transaction.description || '',
        date: getDateInputValue(transaction.date),
        fromAccountId: transferEntries.expense?.account_id || '',
        toAccountId: transferEntries.income?.account_id || '',
      });
      return;
    }

    setFormState({
      type: transaction.type,
      accountId: transaction.account_id,
      categoryId: transaction.category_id || '',
      amount: String(transaction.amount),
      description: transaction.description || '',
      date: getDateInputValue(transaction.date),
      fromAccountId: '',
      toAccountId: '',
    });
  };

  useEffect(() => {
    initializeForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction?.id]);

  const activeCategories =
    formState.type === 'income' ? incomeCategories : expenseCategories;

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    const errors: Record<string, string> = {};
    const parsedAmount = Number(formState.amount);

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.amount = 'Amount must be positive';
    }

    if (isTransfer) {
      if (!formState.fromAccountId) errors.fromAccountId = 'Select source';
      if (!formState.toAccountId) errors.toAccountId = 'Select destination';
      if (formState.fromAccountId === formState.toAccountId) {
        errors.toAccountId = 'Accounts must be different';
      }
    } else {
      if (!formState.accountId) errors.accountId = 'Select an account';
      if (!formState.type) errors.type = 'Select a type';
    }

    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    if (isTransfer && transaction.transfer_id) {
      await updateTransfer.mutateAsync({
        transfer_id: transaction.transfer_id,
        from_account_id: formState.fromAccountId,
        to_account_id: formState.toAccountId,
        amount: parsedAmount,
        description: formState.description || undefined,
        date: formState.date || transaction.date,
      });
      await refetch();
      setEditOpen(false);
      return;
    }

    await updateTransaction.mutateAsync({
      id: transaction.id,
      account_id: formState.accountId,
      category_id: formState.categoryId || undefined,
      type: formState.type,
      amount: parsedAmount,
      description: formState.description || undefined,
      date: formState.date || transaction.date,
    });
    await refetch();
    setEditOpen(false);
  };

  const handleDuplicate = async () => {
    if (!transaction) return;
    await duplicateTransaction.mutateAsync(transaction.id);
    await refetch();
  };

  const handleDelete = async () => {
    if (!transaction) return;
    await deleteTransaction.mutateAsync(transaction.id);
    router.push('/transactions');
  };

  const renderLinkedTransfer = () => {
    if (!isTransfer || !transferEntries.income || !transferEntries.expense) {
      return null;
    }

    const otherSide = linkedTransactions.find(
      (tx) => tx.id !== transaction?.id,
    );

    return (
      <Card className="shadow-card border-border/70">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-base">
            Linked Transfer
          </CardTitle>
          {otherSide && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/transactions/${otherSide.id}`} className="gap-2">
                <LinkIcon size={16} /> View other side
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">From account</p>
              <p className="font-medium">
                {transferEntries.expense.accounts?.name || 'Unknown'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">To account</p>
              <p className="font-medium">
                {transferEntries.income.accounts?.name || 'Unknown'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Transfer pair</p>
              <Badge variant="secondary" className="w-fit">
                {transaction?.transfer_id ?? ''}
              </Badge>
            </div>
          </div>
          <Separator />
          <p className="text-muted-foreground text-xs">
            Deleting or editing will affect both sides of this transfer.
          </p>
        </CardContent>
      </Card>
    );
  };

  const renderFutureSections = () => (
    <div className="grid gap-4 md:grid-cols-1">
      <Card className="shadow-card border-border/70">
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <FileText size={18} />
            Linked Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {documentsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading documents...
            </div>
          ) : linkedDocuments.length > 0 ? (
            <div className="space-y-3">
              {linkedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start justify-between p-3 bg-muted/50 rounded-lg border border-border/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.name}</p>
                    {doc.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {doc.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{doc.file_type.toUpperCase()}</span>
                      <span>•</span>
                      <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="ml-2 flex-shrink-0"
                  >
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gap-2"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No documents linked to this transaction.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading || !transaction) {
    return (
      <DashboardLayout title="Transaction Details" description="Loading…">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading transaction
          details…
        </div>
      </DashboardLayout>
    );
  }

  // Past the loading guard transaction is non-null.
  const currentTransaction = transaction;

  const amountColor =
    currentTransaction.type === 'income' ? 'text-success' : 'text-destructive';

  const typeBadgeClassName =
    currentTransaction.type === 'income'
      ? 'bg-success text-success-foreground'
      : undefined;

  return (
    <DashboardLayout
      title="Transaction Details"
      description="Review, edit, duplicate, or remove this entry"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/transactions" className="gap-2">
              <ArrowLeft size={16} /> Back to list
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              initializeForm();
              setEditOpen(true);
            }}
            disabled={updateTransaction.isPending || updateTransfer.isPending}
            className="gap-2"
          >
            <Pencil size={16} /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            disabled={duplicateTransaction.isPending}
            className="gap-2"
          >
            {duplicateTransaction.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Copy size={16} />
            )}
            Duplicate
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            disabled={deleteTransaction.isPending}
            className="gap-2"
          >
            <Trash2 size={16} /> Delete
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Card className="shadow-card border-border/70">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-xl">
                {currentTransaction.description || 'Transaction'}
              </CardTitle>
              <div className="flex items-center gap-2">
                {isTransfer && <Badge variant="secondary">Transfer</Badge>}
                <Badge
                  variant={
                    currentTransaction.type === 'income'
                      ? 'secondary'
                      : 'destructive'
                  }
                  className={typeBadgeClassName}
                >
                  {currentTransaction.type === 'income' ? 'Income' : 'Expense'}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDateStr(currentTransaction.date)}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Amount</p>
                <p className={`text-lg font-semibold ${amountColor}`}>
                  {formatSignedAmount(
                    currentTransaction.amount,
                    currentTransaction.type,
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Type</p>
                <p className="font-medium capitalize">
                  {currentTransaction.type}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Date</p>
                <p className="font-medium">
                  {formatDateStr(currentTransaction.date)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Account</p>
                <p className="font-medium">
                  {currentTransaction.accounts?.name || 'Unknown account'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Category</p>
                <div className="flex items-center gap-2">
                  {currentTransaction.categories?.color && (
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: currentTransaction.categories.color,
                      }}
                    />
                  )}
                  <p className="font-medium">
                    {currentTransaction.categories?.name || 'Uncategorized'}
                  </p>
                </div>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground text-xs">Notes</p>
              <p className="font-medium">
                {currentTransaction.description || 'No description added.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {renderLinkedTransfer()}

        <Card className="shadow-card border-border/70">
          <CardHeader>
            <CardTitle className="font-display text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <div className="flex items-center gap-2">
              <Repeat size={16} />
              Editing a transfer updates both entries. Deleting removes the
              whole pair.
            </div>
            <div className="flex items-center gap-2">
              <LinkIcon size={16} />
              Duplicate keeps the same amount and date for quick repeats.
            </div>
          </CardContent>
        </Card>

        {renderFutureSections()}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Transaction</DialogTitle>
            <DialogDescription>
              Update the transaction details below.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            {!isTransfer && (
              <div className="flex rounded-lg overflow-hidden border-2 border-border">
                <button
                  type="button"
                  onClick={() =>
                    setFormState((prev) => ({
                      ...prev,
                      type: 'expense',
                      categoryId: '',
                    }))
                  }
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    formState.type === 'expense'
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-muted'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormState((prev) => ({
                      ...prev,
                      type: 'income',
                      categoryId: '',
                    }))
                  }
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    formState.type === 'income'
                      ? 'bg-success text-success-foreground'
                      : 'bg-muted'
                  }`}
                >
                  Income
                </button>
              </div>
            )}

            {isTransfer ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From account *</Label>
                  <Select
                    value={formState.fromAccountId}
                    onValueChange={(value) =>
                      setFormState((prev) => ({
                        ...prev,
                        fromAccountId: value,
                      }))
                    }
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
                  {formErrors.fromAccountId && (
                    <p className="text-sm text-destructive">
                      {formErrors.fromAccountId}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>To account *</Label>
                  <Select
                    value={formState.toAccountId}
                    onValueChange={(value) =>
                      setFormState((prev) => ({ ...prev, toAccountId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem
                          key={acc.id}
                          value={acc.id}
                          disabled={acc.id === formState.fromAccountId}
                        >
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.toAccountId && (
                    <p className="text-sm text-destructive">
                      {formErrors.toAccountId}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account *</Label>
                  <Select
                    value={formState.accountId}
                    onValueChange={(value) =>
                      setFormState((prev) => ({ ...prev, accountId: value }))
                    }
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
                  {formErrors.accountId && (
                    <p className="text-sm text-destructive">
                      {formErrors.accountId}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formState.categoryId || "__none__"}
                    onValueChange={(value) =>
                      setFormState((prev) => ({ ...prev, categoryId: value === "__none__" ? "" : value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No category</SelectItem>
                      {activeCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: cat.color || '#6366F1',
                              }}
                            />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.amount}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
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
                  value={formState.date}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={formState.description}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Add context for future you"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  updateTransaction.isPending || updateTransfer.isPending
                }
              >
                {updateTransaction.isPending || updateTransfer.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction</AlertDialogTitle>
            <AlertDialogDescription>
              {isTransfer
                ? 'This will delete both sides of the transfer.'
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTransaction.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
