'use client';

import { useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { DatePicker } from '@/components/molecules/common/DatePicker';
import { CreateCategoryDialog } from '@/components/molecules/common/CreateCategoryDialog';
import { CategorySelect } from '@/components/molecules/categories/CategorySelect';
import { AccountFormDialog } from '@/components/organisms/modules/accounts/AccountFormDialog';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeTransactionDialogDefaults } from '@/lib/transaction-dialog-utils';
import {
  getInsufficientBalanceDetails,
  showInsufficientBalanceToast,
} from '@/lib/insufficient-balance';
import { createTransactionSchema, createTransferSchema } from '@/lib/validation/transaction';
import { applyZodErrors } from '@/lib/utils/form-errors';
import { useToast } from '@/hooks/useToast';
import type { TransactionDialogDefaults } from '@/types/transaction-dialog-types';
import type { Account, CreateAccountData } from '@/types/account-types';
import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';

type FormMode = 'expense' | 'income' | 'transfer';

type TransactionFormValues = {
  mode: FormMode;
  account_id: string;
  category_id: string;
  from_account_id: string;
  to_account_id: string;
  amount: string;
  description: string;
  date: string;
};

interface TransactionFormDialogProps {
  open: boolean;
  formKey: number;
  onOpenChange: (open: boolean) => void;
  defaults?: TransactionDialogDefaults;
}

function createFormState(
  sanitizedDefaults: TransactionDialogDefaults,
  accounts: Account[],
): TransactionFormValues & { preserveAccount: boolean } {
  const defaultAccountId =
    sanitizedDefaults.accountId != null
      ? sanitizedDefaults.accountId
      : accounts.length === 1
        ? accounts[0].id
        : '';

  return {
    mode: (sanitizedDefaults.mode ?? 'expense') as FormMode,
    account_id: defaultAccountId,
    category_id: sanitizedDefaults.categoryId ?? '',
    from_account_id: sanitizedDefaults.fromAccountId ?? '',
    to_account_id: sanitizedDefaults.toAccountId ?? '',
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
  const { toast } = useToast();
  const { createTransaction, createTransfer, isCreatingTransaction, isCreatingTransfer } =
    useTransactions(1, 7, undefined, {
      enableList: false,
    });
  const { createAccount, isCreatingAccount } = useAccounts();

  const initial = createFormState(sanitizedDefaults, accounts);
  const preserveAccountRef = useRef(initial.preserveAccount);

  const form = useForm<TransactionFormValues>({
    defaultValues: {
      mode: initial.mode,
      account_id: initial.account_id,
      category_id: initial.category_id,
      from_account_id: initial.from_account_id,
      to_account_id: initial.to_account_id,
      amount: initial.amount,
      description: initial.description,
      date: initial.date,
    },
  });

  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [accountFormOpen, setAccountFormOpen] = useState(false);

  const mode = form.watch('mode');
  const fromAccountId = form.watch('from_account_id');
  const isSubmitting = isCreatingTransaction || isCreatingTransfer;

  const categories = useMemo(
    () => (mode === 'income' ? incomeCategories : expenseCategories),
    [mode, incomeCategories, expenseCategories],
  );

  const resetAfterSave = () => {
    form.setValue('amount', '');
    form.setValue('description', '');
    form.setValue('category_id', '');
    form.clearErrors();
    if (mode !== 'transfer' && !preserveAccountRef.current) {
      form.setValue('account_id', '');
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onOpenChange(false);
  };

  const submitTransaction = async (closeAfter: boolean) => {
    if (!user) return;
    form.clearErrors();

    const values = form.getValues();

    if (mode === 'transfer') {
      const result = createTransferSchema.safeParse({
        from_account_id: values.from_account_id,
        to_account_id: values.to_account_id,
        amount: parseFloat(values.amount),
        description: values.description || undefined,
        date: values.date,
      });
      if (!result.success) {
        applyZodErrors(form, result.error);
        return;
      }
      const transferBalanceError = getInsufficientBalanceDetails(
        result.data.from_account_id,
        result.data.amount,
        accounts,
      );
      if (transferBalanceError) {
        showInsufficientBalanceToast(
          toast,
          transferBalanceError.available,
          transferBalanceError.required,
        );
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
      account_id: values.account_id,
      category_id: values.category_id || undefined,
      type: mode,
      amount: parseFloat(values.amount),
      description: values.description || undefined,
      date: values.date,
    });
    if (!result.success) {
      applyZodErrors(form, result.error);
      return;
    }
    if (mode === 'expense') {
      const expenseBalanceError = getInsufficientBalanceDetails(
        result.data.account_id,
        result.data.amount,
        accounts,
      );
      if (expenseBalanceError) {
        showInsufficientBalanceToast(
          toast,
          expenseBalanceError.available,
          expenseBalanceError.required,
        );
        return;
      }
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
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Tabs
              value={mode}
              onValueChange={v => {
                form.setValue('mode', v as FormMode);
                form.clearErrors();
                form.setValue('category_id', '');
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
                <FormField
                  control={form.control}
                  name="from_account_id"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs">From</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Source account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map(acc => (
                            <SelectItem key={acc.id} value={acc.id}>
                              {acc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="to_account_id"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs">To</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Destination account" />
                          </SelectTrigger>
                        </FormControl>
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
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="account_id"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs">Account</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map(acc => (
                            <SelectItem key={acc.id} value={acc.id}>
                              {acc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs">Category</FormLabel>
                      <FormControl>
                        <CategorySelect
                          categories={categories}
                          value={field.value}
                          onValueChange={v => {
                            if (v === 'create_new') setCreateCategoryOpen(true);
                            else field.onChange(v);
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
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs">Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="h-9 text-base font-medium tabular-nums"
                        min="0"
                        step="0.01"
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs">Date</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs">Note</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Optional"
                      className="h-9"
                      maxLength={255}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

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
        </Form>
      )}

      {mode !== 'transfer' && (
        <CreateCategoryDialog
          open={createCategoryOpen}
          onOpenChange={setCreateCategoryOpen}
          type={mode}
          onCategoryCreated={id => form.setValue('category_id', id)}
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
