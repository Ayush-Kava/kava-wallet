'use client';

import { useState } from 'react';
import { z } from 'zod';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useAccounts } from '@/hooks/useAccounts';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const accountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['cash', 'bank', 'credit_card', 'wallet']),
  balance: z.string().optional(),
  currency: z.string().min(1, 'Currency is required'),
  color: z.string().min(1, 'Color is required'),
});

export default function NewAccountPage() {
  const { createAccount } = useAccounts();

  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'credit_card' | 'wallet'>(
    'bank',
  );
  const [balance, setBalance] = useState('0');
  const [currency, setCurrency] = useState('INR');
  const [color, setColor] = useState('#10B981');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const result = accountSchema.safeParse({
      name,
      type,
      balance,
      currency,
      color,
    });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    await createAccount.mutateAsync({
      name,
      type,
      balance: parseFloat(balance || '0'),
      currency,
      color,
    });
    setIsSubmitting(false);
    setName('');
    setBalance('0');
  };

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="New Account"
        description="Create a new account to manage your finances."
      >
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl lg:text-3xl font-display font-bold">
                New Account
              </h1>
              <p className="text-muted-foreground">
                Create an account without using a modal.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/accounts">Back to Accounts</Link>
            </Button>
          </div>

          <Card className="shadow-card border-border/70">
            <CardHeader>
              <CardTitle className="font-display">Account Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Salary Account"
                    />
                    {formErrors.name && (
                      <p className="text-sm text-destructive">
                        {formErrors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Type *</Label>
                    <Select
                      value={type}
                      onValueChange={(val) => setType(val as typeof type)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank">Bank</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="wallet">Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Starting Balance</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Currency *</Label>
                    <Input
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    />
                    {formErrors.currency && (
                      <p className="text-sm text-destructive">
                        {formErrors.currency}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Color *</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        className="w-16 h-10 p-1"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                      />
                      <Input
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                      />
                    </div>
                    {formErrors.color && (
                      <p className="text-sm text-destructive">
                        {formErrors.color}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full md:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    'Save Account'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
