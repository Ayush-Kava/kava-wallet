'use client';

import { useState } from 'react';
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

const loanSchema = z.object({
  name: z.string().min(1, 'Loan name is required'),
  principal: z.coerce.number().positive('Principal must be positive'),
  interest_rate: z.coerce.number().min(0, 'Interest rate cannot be negative'),
  tenure_months: z.coerce
    .number()
    .int()
    .positive('Tenure must be at least 1 month'),
  // Allow zero so the form can submit before EMI is auto-calculated
  emi_amount: z.coerce
    .number()
    .nonnegative('EMI amount must be zero or positive'),
  start_date: z.string().min(1, 'Start date is required'),
  account_id: z.string().min(1, 'Account is required'),
  category_id: z.string().optional(),
});

type LoanFormData = z.infer<typeof loanSchema>;

interface LoanFormProps {
  onSubmit: (data: CreateLoanData) => Promise<void>;
  isLoading?: boolean;
}

export const LoanForm = ({ onSubmit, isLoading = false }: LoanFormProps) => {
  const [showSchedule, setShowSchedule] = useState(false);
  const { accounts = [] } = useAccounts();
  const { categories = [] } = useCategories();

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      name: '',
      principal: 0,
      interest_rate: 0,
      tenure_months: 12,
      emi_amount: 0,
      start_date: new Date().toISOString().slice(0, 10),
      account_id: '',
      category_id: '',
    },
  });

  const principal = Number(form.watch('principal') ?? 0);
  const interestRate = Number(form.watch('interest_rate') ?? 0);
  const tenureMonths = Number(form.watch('tenure_months') ?? 0);

  // Calculate EMI when inputs change
  const calculateEMI = () => {
    if (!principal || !interestRate || !tenureMonths) return 0;

    const monthlyRate = interestRate / 100 / 12;
    if (monthlyRate === 0) return principal / tenureMonths;

    const numerator =
      principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths);
    const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1;
    return numerator / denominator;
  };

  const emi = calculateEMI();

  // Calculate total amount to be paid
  const totalAmountToPay = !isNaN(emi) && emi > 0 ? emi * tenureMonths : 0;
  const totalInterest =
    !isNaN(totalAmountToPay) && totalAmountToPay > 0
      ? totalAmountToPay - principal
      : 0;

  const handleSubmit = async (data: LoanFormData) => {
    const payload: CreateLoanData = {
      ...data,
      emi_amount: emi,
    };
    await onSubmit(payload);
  };

  return (
    <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
      <div className="px-6 py-6 border-b border-gray-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold">Create New Loan</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Enter loan details to set up EMI tracking
        </p>
      </div>
      <div className="px-6 py-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
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
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        {...field}
                      />
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
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* EMI Display & Total Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-slate-800 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monthly EMI
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ₹{!isNaN(emi) && emi > 0 ? emi.toFixed(2) : '0.00'}
                </p>
              </div>

              <div className="bg-green-50 dark:bg-slate-800 p-4 rounded-lg border border-green-200 dark:border-green-900">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total You Will Pay
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ₹
                  {!isNaN(totalAmountToPay) && totalAmountToPay > 0
                    ? totalAmountToPay.toFixed(2)
                    : '0.00'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  (Principal: ₹
                  {principal && !isNaN(principal)
                    ? principal.toFixed(2)
                    : '0.00'}{' '}
                  + Interest: ₹
                  {!isNaN(totalInterest) && totalInterest > 0
                    ? totalInterest.toFixed(2)
                    : '0.00'}
                  )
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
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat: Category) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
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
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showSchedule ? 'Hide' : 'Preview'} EMI Schedule
            </button>

            {showSchedule && principal && interestRate && tenureMonths && (
              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700">
                      <th className="text-left">Month</th>
                      <th className="text-right">EMI</th>
                      <th className="text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Math.min(tenureMonths, 12) }).map(
                      (_, i) => {
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
                            className="border-b border-gray-200 dark:border-slate-700 text-xs"
                          >
                            <td>{i + 1}</td>
                            <td className="text-right">
                              ₹{totalEmi.toFixed(0)}
                            </td>
                            <td className="text-right">
                              ₹{Math.max(0, balance).toFixed(0)}
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
                {tenureMonths > 12 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
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
      </div>
    </div>
  );
};
