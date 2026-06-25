'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { DatePicker } from '@/components/molecules/common/DatePicker';
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
import { useDocuments } from '@/hooks/useDocuments';
import { LinkDocumentToEntityDialog } from '@/components/organisms/modules/documents/LinkDocumentToEntityDialog';
import { ROUTES } from '@/lib/constants/routes';
import type { Transaction } from '@/types/transaction-types';
import type { LinkedEntityType } from '@/types/document-types';
import { CategoryOption } from '@/components/molecules/categories/CategoryOption';
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

const buildEditFormState = (
  transaction: Transaction,
  isTransfer: boolean,
  transferEntries: { income?: Transaction; expense?: Transaction },
): EditFormState => {
  if (isTransfer) {
    return {
      type: transaction.type,
      accountId: transaction.account_id,
      categoryId: transaction.category_id ?? '',
      amount: String(transaction.amount),
      description: transaction.description || '',
      date: getDateInputValue(transaction.date),
      fromAccountId: transferEntries.expense?.account_id ?? '',
      toAccountId: transferEntries.income?.account_id ?? '',
    };
  }

  return {
    type: transaction.type,
    accountId: transaction.account_id,
    categoryId: transaction.category_id ?? '',
    amount: String(transaction.amount),
    description: transaction.description || '',
    date: getDateInputValue(transaction.date),
    fromAccountId: '',
    toAccountId: '',
  };
};

interface TransactionEditFormProps {
  transaction: Transaction;
  transferEntries: { income?: Transaction; expense?: Transaction };
  isTransfer: boolean;
  accounts: ReturnType<typeof useAccounts>['accounts'];
  incomeCategories: ReturnType<typeof useCategories>['incomeCategories'];
  expenseCategories: ReturnType<typeof useCategories>['expenseCategories'];
  isUpdatingTransaction: boolean;
  isUpdatingTransfer: boolean;
  updateTransaction: ReturnType<typeof useTransactions>['updateTransaction'];
  updateTransfer: ReturnType<typeof useTransactions>['updateTransfer'];
  refetch: () => Promise<unknown>;
  onClose: () => void;
}

function TransactionEditForm({
  transaction,
  transferEntries,
  isTransfer,
  accounts,
  incomeCategories,
  expenseCategories,
  isUpdatingTransaction,
  isUpdatingTransfer,
  updateTransaction,
  updateTransfer,
  refetch,
  onClose,
}: TransactionEditFormProps) {
  const [formState, setFormState] = useState<EditFormState>(() =>
    buildEditFormState(transaction, isTransfer, transferEntries),
  );
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const activeCategories = formState.type === 'income' ? incomeCategories : expenseCategories;
  const selectedCategory = activeCategories.find(c => c.id === formState.categoryId);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      await updateTransfer({
        transfer_id: transaction.transfer_id,
        from_account_id: formState.fromAccountId,
        to_account_id: formState.toAccountId,
        amount: parsedAmount,
        description: formState.description || undefined,
        date: formState.date || transaction.date,
      });
      await refetch();
      onClose();
      return;
    }

    await updateTransaction({
      id: transaction.id,
      account_id: formState.accountId,
      category_id: formState.categoryId || undefined,
      type: formState.type,
      amount: parsedAmount,
      description: formState.description || undefined,
      date: formState.date || transaction.date,
    });
    await refetch();
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display">Edit Transaction</DialogTitle>
        <DialogDescription>Update the transaction details below.</DialogDescription>
      </DialogHeader>
      <form className="space-y-4" onSubmit={handleEditSubmit}>
        {!isTransfer && (
          <div className="flex overflow-hidden rounded-lg border-2 border-border">
            <button
              type="button"
              onClick={() =>
                setFormState(prev => ({
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
                setFormState(prev => ({
                  ...prev,
                  type: 'income',
                  categoryId: '',
                }))
              }
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                formState.type === 'income' ? 'bg-success text-success-foreground' : 'bg-muted'
              }`}
            >
              Income
            </button>
          </div>
        )}

        {isTransfer ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>From account *</Label>
              <Select
                value={formState.fromAccountId}
                onValueChange={value =>
                  setFormState(prev => ({
                    ...prev,
                    fromAccountId: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.fromAccountId && (
                <p className="text-sm text-destructive">{formErrors.fromAccountId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>To account *</Label>
              <Select
                value={formState.toAccountId}
                onValueChange={value => setFormState(prev => ({ ...prev, toAccountId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
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
                <p className="text-sm text-destructive">{formErrors.toAccountId}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Account *</Label>
              <Select
                value={formState.accountId}
                onValueChange={value => setFormState(prev => ({ ...prev, accountId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.accountId && (
                <p className="text-sm text-destructive">{formErrors.accountId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formState.categoryId || '__none__'}
                onValueChange={value =>
                  setFormState(prev => ({
                    ...prev,
                    categoryId: value === '__none__' ? '' : value,
                  }))
                }
              >
                <SelectTrigger>
                  {selectedCategory ? (
                    <CategoryOption
                      className="min-w-0 flex-1"
                      name={selectedCategory.name}
                      icon={selectedCategory.icon}
                      color={selectedCategory.color}
                    />
                  ) : (
                    <SelectValue placeholder="Select category" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No category</SelectItem>
                  {activeCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <CategoryOption name={cat.name} icon={cat.icon} color={cat.color} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Amount *</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formState.amount}
              onChange={e =>
                setFormState(prev => ({
                  ...prev,
                  amount: e.target.value,
                }))
              }
            />
            {formErrors.amount && <p className="text-sm text-destructive">{formErrors.amount}</p>}
          </div>

          <div className="space-y-2">
            <Label>Date *</Label>
            <DatePicker
              value={formState.date}
              onChange={date => setFormState(prev => ({ ...prev, date }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            rows={3}
            value={formState.description}
            onChange={e =>
              setFormState(prev => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Add context for future you"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isUpdatingTransaction || isUpdatingTransfer}>
            {isUpdatingTransaction || isUpdatingTransfer ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Save changes'
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export default function TransactionDetail({ transactionId }: TransactionDetailProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { transaction, linkedTransactions, isLoading, refetch } = useTransactionById(transactionId);
  const { accounts } = useAccounts();
  const { incomeCategories, expenseCategories } = useCategories();
  const {
    updateTransaction,
    updateTransfer,
    deleteTransaction,
    duplicateTransaction,
    isUpdatingTransaction,
    isUpdatingTransfer,
    isDeletingTransaction,
    isDuplicatingTransaction,
  } = useTransactions(1, 7, undefined, { enableList: false });

  const { addDocumentLink, removeDocumentLink } = useDocuments();

  // Fetch linked documents for this transaction
  const {
    data: linkedDocuments = [],
    isLoading: documentsLoading,
    refetch: refetchLinkedDocuments,
  } = useQuery({
    queryKey: ['transaction-documents', transactionId, user?.id],
    queryFn: () => documentsApi.getDocumentsByLinkedEntity('transaction', transactionId),
    enabled: !!user && !!transactionId,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editSession, setEditSession] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [linkDocOpen, setLinkDocOpen] = useState(false);

  const isTransfer = Boolean(transaction?.transfer_id);

  const transferEntries = useMemo(() => {
    if (!transaction) return { income: undefined, expense: undefined };
    const entries = [transaction, ...linkedTransactions];
    return {
      income: entries.find(tx => tx.type === 'income'),
      expense: entries.find(tx => tx.type === 'expense'),
    } as { income?: Transaction; expense?: Transaction };
  }, [transaction, linkedTransactions]);

  const handleDuplicate = async () => {
    if (!transaction) return;
    await duplicateTransaction(transaction.id);
    await refetch();
  };

  const handleDelete = async () => {
    if (!transaction) return;
    await deleteTransaction(transaction.id);
    router.push(ROUTES.transactions);
  };

  const handleLinkDocument = async (
    documentId: string,
    entityType: LinkedEntityType,
    entityId: string,
  ) => {
    await addDocumentLink.mutateAsync({
      document_id: documentId,
      linked_entity_type: entityType,
      linked_entity_id: entityId,
    });
    await refetchLinkedDocuments();
  };

  const handleUnlinkDocument = async (documentId: string) => {
    const doc = linkedDocuments.find(d => d.id === documentId);
    const link = doc?.links?.find(l => l.linked_entity_id === transactionId);
    if (!link) return;
    await removeDocumentLink.mutateAsync({ linkId: link.id, documentId });
    await refetchLinkedDocuments();
  };

  const renderLinkedTransfer = () => {
    if (!isTransfer || !transferEntries.income || !transferEntries.expense) {
      return null;
    }

    const otherSide = linkedTransactions.find(tx => tx.id !== transaction?.id);

    return (
      <Card className="border-border/70 shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-base">Linked Transfer</CardTitle>
          {otherSide && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/app/transactions/${otherSide.id}`} className="gap-2">
                <LinkIcon size={16} /> View other side
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">From account</p>
              <p className="font-medium">{transferEntries.expense.accounts?.name || 'Unknown'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">To account</p>
              <p className="font-medium">{transferEntries.income.accounts?.name || 'Unknown'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Transfer pair</p>
              <Badge variant="secondary" className="w-fit">
                {transaction?.transfer_id ?? ''}
              </Badge>
            </div>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            Deleting or editing will affect both sides of this transfer.
          </p>
        </CardContent>
      </Card>
    );
  };

  const renderFutureSections = () => (
    <div className="grid gap-4 md:grid-cols-1">
      <Card className="border-border/70 shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display flex items-center gap-2 text-base">
            <FileText size={18} />
            Linked Documents
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLinkDocOpen(true)}
            disabled={addDocumentLink.isPending}
            className="gap-2"
          >
            <LinkIcon size={16} /> Link Document
          </Button>
        </CardHeader>
        <CardContent className="text-sm">
          {documentsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading documents...
            </div>
          ) : linkedDocuments.length > 0 ? (
            <div className="space-y-3">
              {linkedDocuments.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-start justify-between rounded-lg border border-border/50 bg-muted/50 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={ROUTES.document(doc.id)}
                      className="truncate font-medium hover:underline"
                    >
                      {doc.name}
                    </Link>
                    {doc.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {doc.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{doc.file_type.toUpperCase()}</span>
                      <span>•</span>
                      <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                  <div className="ml-2 flex flex-shrink-0 gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={16} />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnlinkDocument(doc.id)}
                      disabled={removeDocumentLink.isPending}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No documents linked to this transaction.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading || !transaction) {
    return (
      <DashboardLayout title="Transaction Details" description="Loading…">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading transaction details…
        </div>
      </DashboardLayout>
    );
  }

  // Past the loading guard transaction is non-null.
  const currentTransaction = transaction;

  const amountColor = currentTransaction.type === 'income' ? 'text-success' : 'text-destructive';

  const typeBadgeClassName =
    currentTransaction.type === 'income' ? 'bg-success text-success-foreground' : undefined;

  return (
    <DashboardLayout
      title="Transaction Details"
      description="Review, edit, duplicate, or remove this entry"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/transactions" className="gap-2">
              <ArrowLeft size={16} /> Back to list
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditSession(session => session + 1);
              setEditOpen(true);
            }}
            disabled={isUpdatingTransaction || isUpdatingTransfer}
            className="gap-2"
          >
            <Pencil size={16} /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            disabled={isDuplicatingTransaction}
            className="gap-2"
          >
            {isDuplicatingTransaction ? (
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
            disabled={isDeletingTransaction}
            className="gap-2"
          >
            <Trash2 size={16} /> Delete
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Card className="border-border/70 shadow-card">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-xl">
                {currentTransaction.description || 'Transaction'}
              </CardTitle>
              <div className="flex items-center gap-2">
                {isTransfer && <Badge variant="secondary">Transfer</Badge>}
                <Badge
                  variant={currentTransaction.type === 'income' ? 'secondary' : 'destructive'}
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
            <div className="grid gap-4 text-sm md:grid-cols-5">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className={`text-lg font-semibold ${amountColor}`}>
                  {formatSignedAmount(currentTransaction.amount, currentTransaction.type)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{currentTransaction.type}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium">{formatDateStr(currentTransaction.date)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Account</p>
                <p className="font-medium">
                  {currentTransaction.accounts?.name || 'Unknown account'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Category</p>
                {currentTransaction.categories ? (
                  <CategoryOption
                    name={currentTransaction.categories.name}
                    icon={currentTransaction.categories.icon}
                    color={currentTransaction.categories.color}
                  />
                ) : (
                  <p className="font-medium">Uncategorized</p>
                )}
              </div>
            </div>
            <Separator className="my-4" />
            <div className="space-y-1 text-sm">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="font-medium">
                {currentTransaction.description || 'No description added.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {renderLinkedTransfer()}

        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Repeat size={16} />
              Editing a transfer updates both entries. Deleting removes the whole pair.
            </div>
            <div className="flex items-center gap-2">
              <LinkIcon size={16} />
              Duplicate keeps the same amount and date for quick repeats.
            </div>
          </CardContent>
        </Card>

        {renderFutureSections()}
      </div>

      <LinkDocumentToEntityDialog
        open={linkDocOpen}
        onOpenChange={setLinkDocOpen}
        entityType="transaction"
        entityId={transactionId}
        linkedDocumentIds={linkedDocuments.map(d => d.id)}
        onLink={handleLinkDocument}
        isSubmitting={addDocumentLink.isPending}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[540px]">
          {transaction && editOpen && (
            <TransactionEditForm
              key={`${transaction.id}-${editSession}`}
              transaction={transaction}
              transferEntries={transferEntries}
              isTransfer={isTransfer}
              accounts={accounts}
              incomeCategories={incomeCategories}
              expenseCategories={expenseCategories}
              isUpdatingTransaction={isUpdatingTransaction}
              isUpdatingTransfer={isUpdatingTransfer}
              updateTransaction={updateTransaction}
              updateTransfer={updateTransfer}
              refetch={refetch}
              onClose={() => setEditOpen(false)}
            />
          )}
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
              {isDeletingTransaction ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
