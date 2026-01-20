'use client';

import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
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
} from '@/components/ui/dialog';
import type { Account, CreateAccountData } from '@/types/account-types';
import {
  CreditCard,
  Building2,
  Smartphone,
  Wallet,
  Loader2,
} from 'lucide-react';

const accountSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    type: z.enum(['cash', 'bank', 'credit_card', 'wallet']),
    balance: z.number().optional(),
    color: z.string().optional(),
    statement_start_date: z.string().optional(),
    statement_end_date: z.string().optional(),
    due_date: z.string().optional(),
    credit_limit: z.number().optional(),
    min_due: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type !== 'credit_card') return;

    if (!data.statement_start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['statement_start_date'],
        message: 'Statement start date is required for credit cards',
      });
    }

    if (!data.statement_end_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['statement_end_date'],
        message: 'Statement end date is required for credit cards',
      });
    }

    if (!data.due_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['due_date'],
        message: 'Due date is required for credit cards',
      });
    }

    if (data.credit_limit === undefined || data.credit_limit === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['credit_limit'],
        message: 'Credit limit is required for credit cards',
      });
    } else if (data.credit_limit <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['credit_limit'],
        message: 'Credit limit must be greater than zero',
      });
    }

    if (data.min_due !== undefined && data.min_due < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['min_due'],
        message: 'Minimum due cannot be negative',
      });
    }
  });

const accountTypes = [
  { value: 'cash', label: 'Cash', icon: Wallet },
  { value: 'bank', label: 'Bank Account', icon: Building2 },
  { value: 'credit_card', label: 'Credit Card', icon: CreditCard },
  { value: 'wallet', label: 'Digital Wallet', icon: Smartphone },
];

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

type AccountFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateAccountData, accountId?: string) => Promise<void>;
  editingAccount?: Account | null;
  isSubmitting: boolean;
};

export function AccountFormDialog({
  open,
  onOpenChange,
  onSubmit,
  editingAccount,
  isSubmitting,
}: AccountFormDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'credit_card' | 'wallet'>(
    'bank',
  );
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState(colorOptions[0]);
  const [statementStartDate, setStatementStartDate] = useState('');
  const [statementEndDate, setStatementEndDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [minDue, setMinDue] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!editingAccount) {
      resetForm();
      return;
    }

    setName(editingAccount.name);
    setType(editingAccount.type);
    setBalance(String(editingAccount.balance));
    setColor(editingAccount.color);
    setStatementStartDate(editingAccount.statement_start_date || '');
    setStatementEndDate(editingAccount.statement_end_date || '');
    setDueDate(editingAccount.due_date || '');
    setCreditLimit(
      editingAccount.credit_limit !== null &&
        editingAccount.credit_limit !== undefined
        ? String(editingAccount.credit_limit)
        : '',
    );
    setMinDue(
      editingAccount.min_due !== null && editingAccount.min_due !== undefined
        ? String(editingAccount.min_due)
        : '',
    );
    setFormErrors({});
  }, [editingAccount]);

  const resetForm = () => {
    setName('');
    setType('bank');
    setBalance('');
    setColor(colorOptions[0]);
    setStatementStartDate('');
    setStatementEndDate('');
    setDueDate('');
    setCreditLimit('');
    setMinDue('');
    setFormErrors({});
  };

  const accountLabel = useMemo(
    () => (editingAccount ? 'Edit Account' : 'New Account'),
    [editingAccount],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const parsed = accountSchema.safeParse({
      name,
      type,
      balance: balance ? parseFloat(balance) : 0,
      color,
      statement_start_date:
        type === 'credit_card' ? statementStartDate || undefined : undefined,
      statement_end_date:
        type === 'credit_card' ? statementEndDate || undefined : undefined,
      due_date: type === 'credit_card' ? dueDate || undefined : undefined,
      credit_limit:
        type === 'credit_card' && creditLimit
          ? parseFloat(creditLimit)
          : undefined,
      min_due:
        type === 'credit_card' && minDue ? parseFloat(minDue) : undefined,
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setFormErrors(errors);
      return;
    }

    await onSubmit(parsed.data, editingAccount?.id);
    onOpenChange(false);
    resetForm();
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display">{accountLabel}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Account Name *</Label>
            <Input
              placeholder="My Savings Account"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
            {formErrors.name && (
              <p className="text-sm text-destructive">{formErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Account Type *</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as typeof type)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex items-center gap-2">
                      <t.icon size={16} />
                      {t.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Initial Balance</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    color === c
                      ? 'ring-2 ring-offset-2 ring-primary scale-110'
                      : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {type === 'credit_card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Statement Start Date *</Label>
                <Input
                  type="date"
                  value={statementStartDate}
                  onChange={(e) => setStatementStartDate(e.target.value)}
                />
                {formErrors.statement_start_date && (
                  <p className="text-sm text-destructive">
                    {formErrors.statement_start_date}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Statement End Date *</Label>
                <Input
                  type="date"
                  value={statementEndDate}
                  onChange={(e) => setStatementEndDate(e.target.value)}
                />
                {formErrors.statement_end_date && (
                  <p className="text-sm text-destructive">
                    {formErrors.statement_end_date}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                {formErrors.due_date && (
                  <p className="text-sm text-destructive">
                    {formErrors.due_date}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Credit Limit *</Label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  step="0.01"
                  min="0"
                />
                {formErrors.credit_limit && (
                  <p className="text-sm text-destructive">
                    {formErrors.credit_limit}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Minimum Due (optional)</Label>
                <Input
                  type="number"
                  placeholder="Auto-calculated at 5% if left empty"
                  value={minDue}
                  onChange={(e) => setMinDue(e.target.value)}
                  step="0.01"
                  min="0"
                />
                {formErrors.min_due && (
                  <p className="text-sm text-destructive">
                    {formErrors.min_due}
                  </p>
                )}
              </div>
            </div>
          )}

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
      </DialogContent>
    </Dialog>
  );
}
