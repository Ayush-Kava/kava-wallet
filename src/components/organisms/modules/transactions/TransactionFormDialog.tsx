'use client';

import { useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/molecules/common/DatePicker';
import { CreateCategoryDialog } from '@/components/molecules/common/CreateCategoryDialog';
import { CategorySelect } from '@/components/molecules/categories/CategorySelect';
import { AccountFormDialog } from '@/components/organisms/modules/accounts/AccountFormDialog';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeTransactionDialogDefaults } from '@/lib/transaction-dialog-utils';
import { createTransactionSchema, createTransferSchema } from '@/lib/validation/transaction';
import type { TransactionDialogDefaults } from '@/types/transaction-dialog-types';
import type { Account, CreateAccountData } from '@/types/account-types';
import { Loader2, Plus } from 'lucide-react';

type FormMode = 'expense' | 'income' | 'transfer';

interface TransactionFormDialogProps {
  open: boolean;
  formKey: number;
  onOpenChange: (open: boolean) => void;
  defaults?: TransactionDialogDefaults;
}

function createFormState(
  sanitizedDefaults: TransactionDialogDefaults,
  accounts: Account[],
) {
  const defaultAccountId =
    sanitizedDefaults.accountId ?? (accounts.length === 1 ? accounts[0].id : '');

  return {
    mode: (sanitizedDefaults.mode ?? 'expense') as FormMode,
    accountId: defaultAccountId,
    categoryId: sanitizedDefaults.categoryId ?? '',
    fromAccountId: sanitizedDefaults.fromAccountId ?? '',
    toAccountId: sanitizedDefaults.toAccountId ?? '',
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    preserveAccount: Boolean(
      sanitizedDefaults.preserveAccountOnSave || sanitizedDefaults.accountId,
    ),
  };
}

interface TransactionFormBodyProps {
  sanitizedDefaults: TransactionDialogDefaults;
  accounts: Account[];
  incomeCategories: ReturnType<typeof useCategories>['incomeCategories'];
  expenseCategories: ReturnType<typeof useCategories>['expenseCategories'];
  onOpenChange: (open: boolean) => void;
}

function TransactionFormBody({
  sanitizedDefaults,
  accounts,
  incomeCategories,
  expenseCategories,
  onOpenChange,
}: TransactionFormBodyProps) {
  const { user } = useAuth();
  const { createTransaction, createTransfer, isCreatingTransaction, isCreatingTransfer } =
    useTransactions(1, 7, undefined, {
      enableList: false,
    });
  const { createAccount, isCreatingAccount } = useAccounts();

  const initial = createFormState(sanitizedDefaults, accounts);
  const preserveAccountRef = useRef(initial.preserveAccount);

  const [mode, setMode] = useState<FormMode>(initial.mode);
  const [accountId, setAccountId] = useState(initial.accountId);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [amount, setAmount] = useState(initial.amount);
  const [description, setDescription] = useState(initial.description);
  const [date, setDate] = useState(initial.date);
  const [fromAccountId, setFromAccountId] = useState(initial.fromAccountId);
  const [toAccountId, setToAccountId] = useState(initial.toAccountId);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [accountFormOpen, setAccountFormOpen] = useState(false);

  const isSubmitting = isCreatingTransaction || isCreatingTransfer;

  const categories = useMemo(
    () => (mode === 'income' ? incomeCategories : expenseCategories),
    [mode, incomeCategories, expenseCategories],
  );

  const resetAfterSave = () => {
    setAmount('');
    setDescription('');
    setCategoryId('');
    setFormErrors({});
    if (mode !== 'transfer' && !preserveAccountRef.current) {
      setAccountId('');
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onOpenChange(false);
  };

  const submitTransaction = async (closeAfter: boolean) => {
    if (!user) return;
    setFormErrors({});

    if (mode === 'transfer') {
      const result = createTransferSchema.safeParse({
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount: parseFloat(amount),
        description: description || undefined,
        date,
      });
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.errors.forEach(err => {
          if (err.path[0]) errors[err.path[0] as string] = err.message;
        });
        setFormErrors(errors);
        return;
      }
      await createTransfer({
        ...result.data,
        description: result.data.description ?? undefined,
      });
      onOpenChange(false);
      return;
    }

    const result = createTransactionSchema.safeParse({
      account_id: accountId,
      category_id: categoryId || undefined,
      type: mode,
      amount: parseFloat(amount),
      description: description || undefined,
      date,
    });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setFormErrors(errors);
      return;
    }
    await createTransaction({
      ...result.data,
      category_id: result.data.category_id ?? undefined,
      description: result.data.description ?? undefined,
    });
    if (closeAfter) onOpenChange(false);
    else resetAfterSave();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const closeAfter =
      (e.nativeEvent as SubmitEvent).submitter?.getAttribute('data-close') === 'true';
    void submitTransaction(closeAfter);
  };

  const handleCreateAccount = async (data: CreateAccountData) => {
    await createAccount(data);
    setAccountFormOpen(false);
  };

  const canSubmit =
    !!user && accounts.length > 0 && (mode !== 'transfer' || accounts.length >= 2) && !isSubmitting;

  if (!user) return null;

  return (
    <>
      {accounts.length === 0 ? (
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Create an account before recording transactions.
          </p>
          <Button type="button" size="sm" onClick={() => setAccountFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add account
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Tabs
            value={mode}
            onValueChange={v => {
              setMode(v as FormMode);
              setFormErrors({});
              setCategoryId('');
            }}
          >
            <TabsList className="grid h-9 w-full grid-cols-3">
              <TabsTrigger value="expense" className="text-xs">
                Expense
              </TabsTrigger>
              <TabsTrigger value="income" className="text-xs">
                Income
              </TabsTrigger>
              <TabsTrigger value="transfer" className="text-xs">
                Transfer
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {mode === 'transfer' && accounts.length < 2 && (
            <p className="text-xs text-muted-foreground">
              Transfers need at least two accounts.{' '}
              <button
                type="button"
                className="text-primary underline-offset-4 hover:underline"
                onClick={() => setAccountFormOpen(true)}
              >
                Add another account
              </button>
            </p>
          )}

          {mode === 'transfer' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">From</Label>
                <Select value={fromAccountId} onValueChange={setFromAccountId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Source account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.from_account_id && (
                  <p className="text-xs text-destructive">{formErrors.from_account_id}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">To</Label>
                <Select value={toAccountId} onValueChange={setToAccountId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Destination account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(acc => (
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
                  <p className="text-xs text-destructive">{formErrors.to_account_id}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Account</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger className="h-9">
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
                {formErrors.account_id && (
                  <p className="text-xs text-destructive">{formErrors.account_id}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <CategorySelect
                  categories={categories}
                  value={categoryId}
                  onValueChange={v => {
                    if (v === 'create_new') setCreateCategoryOpen(true);
                    else setCategoryId(v);
                  }}
                  placeholder="Optional"
                  triggerClassName="h-9"
                  extraItems={
                    <SelectItem value="create_new">
                      <span className="flex items-center gap-2 text-primary">
                        <Plus className="h-3.5 w-3.5" />
                        New category
                      </span>
                    </SelectItem>
                  }
                />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Amount</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="h-9 text-base font-medium tabular-nums"
                min="0"
                step="0.01"
                autoFocus
              />
              {formErrors.amount && (
                <p className="text-xs text-destructive">{formErrors.amount}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <DatePicker value={date} onChange={setDate} />
              {formErrors.date && <p className="text-xs text-destructive">{formErrors.date}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Note</Label>
            <Input
              placeholder="Optional"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="h-9"
              maxLength={255}
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="submit"
              size="sm"
              disabled={!canSubmit}
              data-close={mode === 'transfer' ? 'true' : 'false'}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === 'transfer' ? (
                'Save transfer'
              ) : (
                'Save & add another'
              )}
            </Button>
            {mode !== 'transfer' && (
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                disabled={!canSubmit}
                data-close="true"
              >
                Save & close
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {mode !== 'transfer' && (
        <CreateCategoryDialog
          open={createCategoryOpen}
          onOpenChange={setCreateCategoryOpen}
          type={mode}
          onCategoryCreated={id => setCategoryId(id)}
        />
      )}

      <AccountFormDialog
        open={accountFormOpen}
        onOpenChange={setAccountFormOpen}
        onSubmit={handleCreateAccount}
        isSubmitting={isCreatingAccount}
      />
    </>
  );
}

export function TransactionFormDialog({
  open,
  formKey,
  onOpenChange,
  defaults = {},
}: TransactionFormDialogProps) {
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const { incomeCategories, expenseCategories } = useCategories();

  const sanitizedDefaults = useMemo(
    () =>
      sanitizeTransactionDialogDefaults(defaults, accounts, incomeCategories, expenseCategories),
    [defaults, accounts, incomeCategories, expenseCategories],
  );

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={next => !next && onOpenChange(false)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
          <DialogDescription>Account, amount, save — done.</DialogDescription>
        </DialogHeader>

        {open && (
          <TransactionFormBody
            key={formKey}
            sanitizedDefaults={sanitizedDefaults}
            accounts={accounts}
            incomeCategories={incomeCategories}
            expenseCategories={expenseCategories}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
