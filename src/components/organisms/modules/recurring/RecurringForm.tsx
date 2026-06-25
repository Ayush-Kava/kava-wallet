'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { DatePicker } from '@/components/molecules/common/DatePicker';
import { CategorySelect } from '@/components/molecules/categories/CategorySelect';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import type { RecurringRule } from '@/types/recurring-types';
import type { CreateRecurringRuleData, RecurringType } from '@/types/recurring-types';

const recurringFormSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    amount: z
      .string()
      .min(1, 'Amount is required')
      .refine(v => !Number.isNaN(Number(v)) && Number(v) > 0, 'Amount must be positive'),
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
    } else if (!data.account_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['account_id'],
        message: 'Account is required',
      });
    }
  });

type RecurringFormValues = z.infer<typeof recurringFormSchema>;

function buildDefaultValues(initialRule?: RecurringRule | null): RecurringFormValues {
  return {
    name: initialRule?.name || '',
    description: initialRule?.description || '',
    amount: initialRule ? String(initialRule.amount) : '',
    type: (initialRule?.type || 'expense') as RecurringType,
    frequency: initialRule?.frequency || 'monthly',
    account_id: initialRule?.account_id ?? '',
    from_account_id: initialRule?.from_account_id ?? '',
    to_account_id: initialRule?.to_account_id ?? '',
    category_id: initialRule?.category_id ?? '',
    next_run_date: initialRule?.next_run_date || '',
    end_date: initialRule?.end_date || '',
    paused: initialRule?.paused || false,
  };
}

type RecurringFormProps = {
  initialRule?: RecurringRule | null;
  onSubmit: (payload: CreateRecurringRuleData) => Promise<void>;
  isSubmitting: boolean;
};

export function RecurringForm({ initialRule, onSubmit, isSubmitting }: RecurringFormProps) {
  const { accounts } = useAccounts();
  const { incomeCategories, expenseCategories } = useCategories();

  const form = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringFormSchema),
    defaultValues: buildDefaultValues(initialRule),
  });

  useEffect(() => {
    form.reset(buildDefaultValues(initialRule));
  }, [initialRule, form]);

  const type = form.watch('type');
  const fromAccountId = form.watch('from_account_id');

  const categories = useMemo(
    () => (type === 'income' ? incomeCategories : expenseCategories),
    [type, incomeCategories, expenseCategories],
  );

  const handleSubmit = async (values: RecurringFormValues) => {
    await onSubmit({
      name: values.name,
      description: values.description || undefined,
      amount: Number(values.amount),
      type: values.type,
      frequency: values.frequency,
      account_id:
        values.type === 'transfer' || !values.account_id ? null : values.account_id,
      from_account_id:
        values.type === 'transfer' && values.from_account_id ? values.from_account_id : null,
      to_account_id:
        values.type === 'transfer' && values.to_account_id ? values.to_account_id : null,
      category_id:
        values.type === 'transfer' || !values.category_id ? null : values.category_id,
      next_run_date: values.next_run_date,
      end_date: values.end_date || undefined,
      paused: values.paused,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="Salary, Rent, Netflix" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Optional note" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frequency *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="next_run_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Next Run Date *</FormLabel>
                <FormControl>
                  <DatePicker value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {type === 'transfer' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="from_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Account *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
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
              name="to_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Account *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts
                        .filter(account => account.id !== fromAccountId)
                        .map(account => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
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
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <CategorySelect
                      categories={categories}
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                      placeholder="Select category"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date (optional)</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="No end date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paused"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3 space-y-0 pt-6">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="cursor-pointer font-normal">Pause rule</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : initialRule ? 'Update Rule' : 'Create Rule'}
        </Button>
      </form>
    </Form>
  );
}
