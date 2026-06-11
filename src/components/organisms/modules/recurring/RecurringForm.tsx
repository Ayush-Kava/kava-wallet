'use client';

import { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/molecules/common/DatePicker';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import type { RecurringRule } from '@/types/recurring-types';
import type { CreateRecurringRuleData, RecurringType } from '@/types/recurring-types';

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    amount: z.number().positive('Amount must be positive'),
    type: z.enum(['income', 'expense', 'transfer']),
    frequency: z.enum(['weekly', 'monthly', 'yearly']),
    account_id: z.string().optional(),
    from_account_id: z.string().optional(),
    to_account_id: z.string().optional(),
    category_id: z.string().optional(),
    next_run_date: z.string().min(1, 'Next run date is required'),
    end_date: z.string().optional(),
    paused: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'transfer') {
      if (!data.from_account_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['from_account_id'],
          message: 'From account is required',
        });
      }
      if (!data.to_account_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['to_account_id'],
          message: 'To account is required',
        });
      }
      if (
        data.from_account_id &&
        data.to_account_id &&
        data.from_account_id === data.to_account_id
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['to_account_id'],
          message: 'Accounts must be different',
        });
      }
    } else {
      if (!data.account_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['account_id'],
          message: 'Account is required',
        });
      }
    }
  });

type RecurringFormProps = {
  initialRule?: RecurringRule | null;
  onSubmit: (payload: CreateRecurringRuleData) => Promise<void>;
  isSubmitting: boolean;
};

export function RecurringForm({ initialRule, onSubmit, isSubmitting }: RecurringFormProps) {
  const { accounts } = useAccounts();
  const { incomeCategories, expenseCategories } = useCategories();

  const [formState, setFormState] = useState(() => ({
    name: initialRule?.name || '',
    description: initialRule?.description || '',
    amount: initialRule ? String(initialRule.amount) : '',
    type: (initialRule?.type || 'expense') as RecurringType,
    frequency: initialRule?.frequency || 'monthly',
    account_id: initialRule?.account_id || '',
    from_account_id: initialRule?.from_account_id || '',
    to_account_id: initialRule?.to_account_id || '',
    category_id: initialRule?.category_id || '',
    next_run_date: initialRule?.next_run_date || '',
    end_date: initialRule?.end_date || '',
    paused: initialRule?.paused || false,
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = formState.type === 'income' ? incomeCategories : expenseCategories;

  const handleChange = (field: keyof typeof formState, value: string | boolean) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});

    const parsed = schema.safeParse({
      ...formState,
      amount: formState.amount ? parseFloat(formState.amount) : 0,
      end_date: formState.end_date || undefined,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.errors.forEach(issue => {
        if (issue.path[0]) nextErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }

    await onSubmit({
      name: parsed.data.name,
      description: parsed.data.description || undefined,
      amount: parsed.data.amount,
      type: parsed.data.type,
      frequency: parsed.data.frequency,
      account_id: parsed.data.type === 'transfer' ? null : parsed.data.account_id,
      from_account_id: parsed.data.type === 'transfer' ? parsed.data.from_account_id : null,
      to_account_id: parsed.data.type === 'transfer' ? parsed.data.to_account_id : null,
      category_id: parsed.data.type === 'transfer' ? null : parsed.data.category_id || null,
      next_run_date: parsed.data.next_run_date,
      end_date: parsed.data.end_date || undefined,
      paused: parsed.data.paused,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Name *</Label>
        <Input
          value={formState.name}
          onChange={e => handleChange('name', e.target.value)}
          placeholder="Salary, Rent, Netflix"
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          value={formState.description}
          onChange={e => handleChange('description', e.target.value)}
          placeholder="Optional note"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Amount *</Label>
          <Input
            type="number"
            value={formState.amount}
            onChange={e => handleChange('amount', e.target.value)}
            step="0.01"
            min="0"
          />
          {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
        </div>

        <div className="space-y-2">
          <Label>Type *</Label>
          <Select
            value={formState.type}
            onValueChange={value => handleChange('type', value as RecurringType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Frequency *</Label>
          <Select
            value={formState.frequency}
            onValueChange={value => handleChange('frequency', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Next Run Date *</Label>
          <DatePicker
            value={formState.next_run_date}
            onChange={value => handleChange('next_run_date', value)}
          />
          {errors.next_run_date && (
            <p className="text-sm text-destructive">{errors.next_run_date}</p>
          )}
        </div>
      </div>

      {formState.type === 'transfer' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>From Account *</Label>
            <Select
              value={formState.from_account_id}
              onValueChange={value => handleChange('from_account_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.from_account_id && (
              <p className="text-sm text-destructive">{errors.from_account_id}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>To Account *</Label>
            <Select
              value={formState.to_account_id}
              onValueChange={value => handleChange('to_account_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  .filter(account => account.id !== formState.from_account_id)
                  .map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.to_account_id && (
              <p className="text-sm text-destructive">{errors.to_account_id}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Account *</Label>
            <Select
              value={formState.account_id}
              onValueChange={value => handleChange('account_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.account_id && <p className="text-sm text-destructive">{errors.account_id}</p>}
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formState.category_id}
              onValueChange={value => handleChange('category_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>End Date (optional)</Label>
          <DatePicker
            value={formState.end_date}
            onChange={value => handleChange('end_date', value)}
            placeholder="No end date"
          />
        </div>
        <div className="flex items-center gap-3 space-y-2">
          <Switch
            id="paused"
            checked={formState.paused}
            onCheckedChange={checked => handleChange('paused', checked)}
          />
          <Label htmlFor="paused" className="cursor-pointer">
            Pause rule
          </Label>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : initialRule ? 'Update Rule' : 'Create Rule'}
      </Button>
    </form>
  );
}
