'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/atoms/Button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/molecules/common/DatePicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import type { CreateLoanData } from '@/types/loan-types';
import type { Account } from '@/types/account-types';
import type { Category } from '@/types/category-types';

const loanFormSchema = z.object({
  name: z.string().min(1, 'Loan name is required'),
  principal: z
    .string()
    .min(1, 'Principal is required')
    .refine(v => Number(v) > 0, 'Principal must be positive'),
  interest_rate: z
    .string()
    .min(1, 'Interest rate is required')
    .refine(v => Number(v) >= 0 && !Number.isNaN(Number(v)), 'Interest rate cannot be negative'),
  tenure_months: z
    .string()
    .min(1, 'Tenure is required')
    .refine(
      v => Number(v) >= 1 && Number.isInteger(Number(v)),
      'Tenure must be at least 1 month',
    ),
  start_date: z.string().min(1, 'Start date is required'),
  account_id: z.string().min(1, 'Account is required'),
  category_id: z.string().optional(),
});

type LoanFormData = z.infer<typeof loanFormSchema>;

const CategoryColorDot = ({ color }: { color?: string }) => (
  <span
    className="h-3 w-3 shrink-0 rounded-full"
    style={{ backgroundColor: color || '#6366F1' }}
  />
);

const CategoryOption = ({ name, color }: { name: string; color?: string }) => (
  <span className="flex items-center gap-2">
    <CategoryColorDot color={color} />
    <span>{name}</span>
  </span>
);

interface LoanFormProps {
  onSubmit: (data: CreateLoanData) => Promise<void>;
  isLoading?: boolean;
  /** When true, renders without card chrome (for use inside a dialog). */
  embedded?: boolean;
}

export const LoanForm = ({ onSubmit, isLoading = false, embedded = false }: LoanFormProps) => {
  const [showSchedule, setShowSchedule] = useState(false);
  const { accounts = [] } = useAccounts();
  const { categories = [] } = useCategories();
  const expenseCategories = useMemo(
    () => categories.filter((cat: Category) => cat.type === 'expense'),
    [categories],
  );

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      name: '',
      principal: '',
      interest_rate: '',
      tenure_months: '',
      start_date: new Date().toISOString().slice(0, 10),
      account_id: '',
      category_id: '',
    },
  });

  const selectedCategoryId = form.watch('category_id');
  const selectedCategory = expenseCategories.find(cat => cat.id === selectedCategoryId);
  const principal = Number(form.watch('principal') || 0);
  const interestRate = Number(form.watch('interest_rate') || 0);
  const tenureMonths = Number(form.watch('tenure_months') || 0);

  // Calculate EMI when inputs change
  const calculateEMI = () => {
    if (!principal || !interestRate || !tenureMonths) return 0;

    const monthlyRate = interestRate / 100 / 12;
    if (monthlyRate === 0) return principal / tenureMonths;

    const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths);
    const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1;
    return numerator / denominator;
  };

  const emi = calculateEMI();

  // Calculate total amount to be paid
  const totalAmountToPay = !isNaN(emi) && emi > 0 ? emi * tenureMonths : 0;
  const totalInterest =
    !isNaN(totalAmountToPay) && totalAmountToPay > 0 ? totalAmountToPay - principal : 0;

  const handleSubmit = async (data: LoanFormData) => {
    const payload: CreateLoanData = {
      name: data.name,
      principal: Number(data.principal),
      interest_rate: Number(data.interest_rate),
      tenure_months: Number(data.tenure_months),
      emi_amount: emi,
      start_date: data.start_date,
      account_id: data.account_id,
      category_id: data.category_id,
    };
    await onSubmit(payload);
  };

  const formBody = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={embedded ? 'space-y-4' : 'space-y-6'}>
            {/* Loan Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Home Loan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Principal & Interest Rate */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="principal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Principal Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interest_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Rate (% p.a.)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tenure & Start Date */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tenure_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenure (Months)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* EMI Display & Total Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-slate-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">Monthly EMI</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ₹{!isNaN(emi) && emi > 0 ? emi.toFixed(2) : '0.00'}
                </p>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-slate-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total You Will Pay</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ₹
                  {!isNaN(totalAmountToPay) && totalAmountToPay > 0
                    ? totalAmountToPay.toFixed(2)
                    : '0.00'}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                  (Principal: ₹{principal && !isNaN(principal) ? principal.toFixed(2) : '0.00'} +
                  Interest: ₹
                  {!isNaN(totalInterest) && totalInterest > 0 ? totalInterest.toFixed(2) : '0.00'})
                </p>
              </div>
            </div>

            {/* Account & Category */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((acc: Account) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name}
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
                    <FormLabel>Category (Optional)</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          {selectedCategory ? (
                            <CategoryOption
                              name={selectedCategory.name}
                              color={selectedCategory.color}
                            />
                          ) : (
                            <SelectValue placeholder="Select category" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent
                        side="bottom"
                        align="start"
                        position="popper"
                        sideOffset={4}
                        collisionPadding={16}
                        className="max-h-48"
                      >
                        {expenseCategories.map((cat: Category) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <CategoryOption name={cat.name} color={cat.color} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Schedule Preview Toggle */}
            <button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              {showSchedule ? 'Hide' : 'Preview'} EMI Schedule
            </button>

            {showSchedule && principal && interestRate && tenureMonths && (
              <div className="max-h-64 overflow-y-auto rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700">
                      <th className="text-left">Month</th>
                      <th className="text-right">EMI</th>
                      <th className="text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Math.min(tenureMonths, 12) }).map((_, i) => {
                      const monthlyRate = interestRate / 100 / 12;
                      let balance = principal;
                      let totalEmi = 0;

                      for (let j = 0; j < i + 1; j++) {
                        const interest = balance * monthlyRate;
                        const principalPay = principal / tenureMonths;
                        totalEmi = principalPay + interest;
                        balance -= principalPay;
                      }

                      return (
                        <tr
                          key={i}
                          className="border-b border-gray-200 text-xs dark:border-slate-700"
                        >
                          <td>{i + 1}</td>
                          <td className="text-right">₹{totalEmi.toFixed(0)}</td>
                          <td className="text-right">₹{Math.max(0, balance).toFixed(0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {tenureMonths > 12 && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Showing first 12 months...
                  </p>
                )}
              </div>
            )}

        {/* Submit */}
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Creating Loan...' : 'Create Loan'}
        </Button>
      </form>
    </Form>
  );

  if (embedded) {
    return formBody;
  }

  return (
    <div className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-gray-200 px-6 py-6 dark:border-slate-700">
        <h2 className="text-2xl font-bold">Create New Loan</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Enter loan details to set up EMI tracking
        </p>
      </div>
      <div className="px-6 py-6">{formBody}</div>
    </div>
  );
};
