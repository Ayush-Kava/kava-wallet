'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Account, AccountType, Bank, CreateAccountData } from '@/types/account-types';
import { DatePicker } from '@/components/molecules/common/DatePicker';
import { CreditCard, Building2, Smartphone, Wallet, Loader2 } from 'lucide-react';
import { useBanks } from '@/hooks/useBanks';
import { applyZodErrors } from '@/lib/utils/form-errors';

function getBankLabel(bank: Bank) {
  return bank.ifsc_prefix ? `${bank.name} (${bank.ifsc_prefix})` : bank.name;
}

function getIfscPlaceholder(bank?: Bank) {
  return bank?.ifsc_prefix ? `${bank.ifsc_prefix.toUpperCase()}0001234` : 'HDFC0001234';
}

function applyIfscPrefixFromBank(
  setIfscCode: (value: string) => void,
  getIfscCode: () => string,
  banks: Bank[],
  bankId: string,
) {
  const bank = banks.find(b => b.id === bankId);
  if (!bank?.ifsc_prefix) return;

  const prefix = bank.ifsc_prefix.toUpperCase();
  const current = getIfscCode();
  if (!current || current.length <= 4) {
    setIfscCode(prefix);
  }
}

const baseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  type: z.enum(['cash', 'bank', 'credit_card', 'wallet']),
  balance: z.number().optional(),
  color: z.string().optional(),
});

const bankFieldsSchema = z.object({
  bank_id: z.string().uuid('Select a bank'),
  account_number: z
    .string()
    .regex(/^\d+$/, 'Account number must contain digits only')
    .min(4, 'Account number is too short'),
  ifsc_code: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, 'Enter a valid 11-character IFSC code')
    .transform(v => v.toUpperCase()),
});

const creditCardSchema = z.object({
  bank_id: z.string().uuid().optional(),
  card_number: z.string().min(4, 'Card number is required').max(19),
  card_holder_name: z.string().optional(),
  expiry_date: z.string().min(1, 'Expiry date is required'),
  statement_start_date: z.string().min(1, 'Statement start date is required'),
  statement_end_date: z.string().min(1, 'Statement end date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  credit_limit: z.number().positive('Credit limit must be greater than zero'),
  min_due: z.number().min(0).optional(),
});

const walletSchema = z.object({
  provider: z.string().optional(),
});

const accountTypes = [
  { value: 'cash', label: 'Cash', icon: Wallet },
  { value: 'bank', label: 'Bank Account', icon: Building2 },
  { value: 'credit_card', label: 'Credit Card', icon: CreditCard },
  { value: 'wallet', label: 'Digital Wallet', icon: Smartphone },
] as const;

const colorOptions = [
  '#10B981',
  '#06B6D4',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F97316',
  '#FBBF24',
  '#84CC16',
];

type AccountFormValues = {
  name: string;
  type: AccountType;
  balance: string;
  color: string;
  bank_id: string;
  account_number: string;
  ifsc_code: string;
  provider: string;
  card_number: string;
  card_holder_name: string;
  expiry_date: string;
  statement_start_date: string;
  statement_end_date: string;
  due_date: string;
  credit_limit: string;
  min_due: string;
};

type AccountFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateAccountData, accountId?: string) => Promise<void>;
  editingAccount?: Account | null;
  isSubmitting: boolean;
  /** When set, new-account forms start on this type and hide the type picker. */
  defaultType?: AccountType;
  title?: string;
};

function getAccountFormValues(
  editingAccount?: Account | null,
  defaultType: AccountType = 'bank',
): AccountFormValues {
  if (!editingAccount) {
    return {
      name: '',
      type: defaultType,
      balance: '',
      color: colorOptions[0],
      bank_id: '',
      account_number: '',
      ifsc_code: '',
      provider: '',
      card_number: '',
      card_holder_name: '',
      expiry_date: '',
      statement_start_date: '',
      statement_end_date: '',
      due_date: '',
      credit_limit: '',
      min_due: '',
    };
  }

  return {
    name: editingAccount.name,
    type: editingAccount.type,
    balance: String(editingAccount.balance),
    color: editingAccount.color,
    bank_id: editingAccount.bank_id ?? '',
    account_number: editingAccount.account_number ?? '',
    ifsc_code: editingAccount.ifsc_code ?? '',
    provider: editingAccount.provider ?? '',
    card_number: editingAccount.card_number ?? '',
    card_holder_name: editingAccount.card_holder_name ?? '',
    expiry_date: editingAccount.expiry_date || '',
    statement_start_date: editingAccount.statement_start_date || '',
    statement_end_date: editingAccount.statement_end_date || '',
    due_date: editingAccount.due_date || '',
    credit_limit:
      editingAccount.credit_limit != null ? String(editingAccount.credit_limit) : '',
    min_due: editingAccount.min_due != null ? String(editingAccount.min_due) : '',
  };
}

function buildPayload(values: AccountFormValues): CreateAccountData | null {
  const base = baseSchema.safeParse({
    name: values.name,
    type: values.type,
    balance: values.balance ? parseFloat(values.balance) : 0,
    color: values.color,
  });
  if (!base.success) return null;

  if (values.type === 'bank') {
    const bank = bankFieldsSchema.safeParse({
      bank_id: values.bank_id || undefined,
      account_number: values.account_number,
      ifsc_code: values.ifsc_code,
    });
    if (!bank.success) return null;
    return {
      type: 'bank',
      name: base.data.name,
      balance: base.data.balance,
      color: base.data.color,
      bank_id: bank.data.bank_id,
      account_number: bank.data.account_number,
      ifsc_code: bank.data.ifsc_code,
    };
  }

  if (values.type === 'wallet') {
    const wallet = walletSchema.safeParse({ provider: values.provider });
    return {
      type: 'wallet',
      name: base.data.name,
      balance: base.data.balance,
      color: base.data.color,
      provider: wallet.success ? wallet.data.provider : undefined,
    };
  }

  if (values.type === 'credit_card') {
    const card = creditCardSchema.safeParse({
      bank_id: values.bank_id || undefined,
      card_number: values.card_number,
      card_holder_name: values.card_holder_name || undefined,
      expiry_date: values.expiry_date,
      statement_start_date: values.statement_start_date,
      statement_end_date: values.statement_end_date,
      due_date: values.due_date,
      credit_limit: values.credit_limit ? parseFloat(values.credit_limit) : undefined,
      min_due: values.min_due ? parseFloat(values.min_due) : undefined,
    });
    if (!card.success) return null;
    return {
      type: 'credit_card',
      name: base.data.name,
      balance: base.data.balance,
      color: base.data.color,
      bank_id: card.data.bank_id,
      card_number: card.data.card_number,
      card_holder_name: card.data.card_holder_name,
      expiry_date: card.data.expiry_date,
      statement_start_date: card.data.statement_start_date,
      statement_end_date: card.data.statement_end_date,
      due_date: card.data.due_date,
      credit_limit: card.data.credit_limit,
      min_due: card.data.min_due,
    };
  }

  return {
    type: 'cash',
    name: base.data.name,
    balance: base.data.balance,
    color: base.data.color,
  };
}

function validateAccountForm(values: AccountFormValues): z.ZodError | null {
  const base = baseSchema.safeParse({
    name: values.name,
    type: values.type,
    balance: values.balance ? parseFloat(values.balance) : 0,
    color: values.color,
  });
  if (!base.success) return base.error;

  if (values.type === 'bank') {
    const bank = bankFieldsSchema.safeParse({
      bank_id: values.bank_id || undefined,
      account_number: values.account_number,
      ifsc_code: values.ifsc_code,
    });
    if (!bank.success) return bank.error;
  }

  if (values.type === 'credit_card') {
    const card = creditCardSchema.safeParse({
      bank_id: values.bank_id || undefined,
      card_number: values.card_number,
      card_holder_name: values.card_holder_name || undefined,
      expiry_date: values.expiry_date,
      statement_start_date: values.statement_start_date,
      statement_end_date: values.statement_end_date,
      due_date: values.due_date,
      credit_limit: values.credit_limit ? parseFloat(values.credit_limit) : undefined,
      min_due: values.min_due ? parseFloat(values.min_due) : undefined,
    });
    if (!card.success) return card.error;
  }

  return null;
}

interface AccountFormProps {
  editingAccount?: Account | null;
  onSubmit: (data: CreateAccountData, accountId?: string) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  defaultType?: AccountType;
  lockType?: boolean;
}

function AccountForm({
  editingAccount,
  onSubmit,
  onOpenChange,
  isSubmitting,
  defaultType,
  lockType = false,
}: AccountFormProps) {
  const resolvedType = defaultType ?? 'bank';
  const { banks, isLoading: banksLoading } = useBanks();
  const form = useForm<AccountFormValues>({
    defaultValues: getAccountFormValues(editingAccount, resolvedType),
  });

  useEffect(() => {
    form.reset(getAccountFormValues(editingAccount, resolvedType));
  }, [editingAccount, resolvedType, form]);

  const type = form.watch('type');
  const color = form.watch('color');
  const bankId = form.watch('bank_id');

  const selectedBank = useMemo(
    () => banks.find(bank => bank.id === bankId),
    [banks, bankId],
  );

  const ifscPlaceholder = getIfscPlaceholder(selectedBank);

  const namePlaceholder = useMemo(() => {
    if (type === 'bank') return 'My Savings Account';
    if (type === 'wallet') return 'PhonePe Wallet';
    if (type === 'credit_card') return 'HDFC Regalia';
    return 'Cash';
  }, [type]);

  const handleSubmit = async (values: AccountFormValues) => {
    form.clearErrors();
    const validationError = validateAccountForm(values);
    if (validationError) {
      applyZodErrors(form, validationError);
      return;
    }

    const payload = buildPayload(values);
    if (!payload) return;

    await onSubmit(payload, editingAccount?.id);
    onOpenChange(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {!lockType && (
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type *</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!!editingAccount}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accountTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          <div className="flex items-center gap-2">
                            <t.icon size={16} />
                            {t.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name *</FormLabel>
                <FormControl>
                  <Input placeholder={namePlaceholder} maxLength={50} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {type === 'bank' && (
            <>
              <FormField
                control={form.control}
                name="bank_id"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Bank *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={value => {
                        field.onChange(value);
                        applyIfscPrefixFromBank(
                          next => form.setValue('ifsc_code', next),
                          () => form.getValues('ifsc_code'),
                          banks,
                          value,
                        );
                      }}
                      disabled={banksLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={banksLoading ? 'Loading banks...' : 'Select bank'}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {banks.map(bank => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {getBankLabel(bank)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="account_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number *</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        placeholder="1234567890"
                        {...field}
                        onChange={e => field.onChange(e.target.value.replace(/\D/g, ''))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ifsc_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IFSC Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={ifscPlaceholder}
                        maxLength={11}
                        {...field}
                        onChange={e => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {type === 'wallet' && (
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Provider (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="PhonePe, Paytm, Google Pay..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {type === 'credit_card' && (
            <>
              <FormField
                control={form.control}
                name="bank_id"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Issuing Bank (optional)</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={banksLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {banks.map(bank => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {getBankLabel(bank)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="card_number"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Card Number *</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        placeholder="123456789"
                        maxLength={19}
                        {...field}
                        onChange={e => field.onChange(e.target.value.replace(/\D/g, ''))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="card_holder_name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Cardholder Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date *</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="credit_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Limit *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="50000" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="statement_start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statement Start Date *</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="statement_end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statement End Date *</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date *</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_due"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Due (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Auto-calculated at 5% if left empty"
                        step="0.01"
                        min="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <FormField
            control={form.control}
            name="balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {type === 'credit_card' ? 'Outstanding Balance' : 'Initial Balance'}
                </FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0.00" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Color</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => field.onChange(c)}
                      className={`h-8 w-8 rounded-lg transition-all ${
                        color === c ? 'scale-110 ring-2 ring-primary ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="animate-spin" />
          ) : editingAccount ? (
            'Update Account'
          ) : (
            'Create Account'
          )}
        </Button>
      </form>
    </Form>
  );
}

export function AccountFormDialog({
  open,
  onOpenChange,
  onSubmit,
  editingAccount,
  isSubmitting,
  defaultType,
  title,
}: AccountFormDialogProps) {
  const [formSession, setFormSession] = useState(0);

  const accountLabel = useMemo(() => {
    if (title) return title;
    if (editingAccount) return 'Edit Account';
    if (defaultType === 'credit_card') return 'New Credit Card';
    return 'New Account';
  }, [editingAccount, defaultType, title]);

  const handleOpenChange = (next: boolean) => {
    if (next) setFormSession(session => session + 1);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">{accountLabel}</DialogTitle>
        </DialogHeader>
        {open && (
          <AccountForm
            key={`${editingAccount?.id ?? defaultType ?? 'new'}-${formSession}`}
            editingAccount={editingAccount}
            onSubmit={onSubmit}
            onOpenChange={onOpenChange}
            isSubmitting={isSubmitting}
            defaultType={defaultType}
            lockType={defaultType != null && !editingAccount}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
