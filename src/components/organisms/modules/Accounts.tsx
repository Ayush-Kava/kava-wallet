'use client';

import { useState } from 'react';
import { z } from 'zod';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
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
import {
  Dialog,
  DialogContent,
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
import { useAccounts } from '@/hooks/useAccounts';
import {
  Plus,
  Wallet,
  Building2,
  CreditCard,
  Smartphone,
  Trash2,
  Edit2,
  Loader2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

const accountSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  type: z.enum(['cash', 'bank', 'credit_card', 'wallet']),
  balance: z.number().optional(),
  color: z.string().optional(),
});

const accountTypes = [
  { value: 'cash', label: 'Cash', icon: Wallet },
  { value: 'bank', label: 'Bank Account', icon: Building2 },
  { value: 'credit_card', label: 'Credit Card', icon: CreditCard },
  { value: 'wallet', label: 'Digital Wallet', icon: Smartphone },
];

const colors = [
  '#10B981',
  '#06B6D4',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F97316',
  '#FBBF24',
  '#84CC16',
];

const Accounts = () => {
  const {
    accounts,
    isLoading,
    totalBalance,
    createAccount,
    updateAccount,
    deleteAccount,
  } = useAccounts();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'credit_card' | 'wallet'>(
    'bank',
  );
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState(colors[0]);

  const resetForm = () => {
    setName('');
    setType('bank');
    setBalance('');
    setColor(colors[0]);
    setFormErrors({});
    setEditingAccount(null);
  };

  const handleEdit = (account: (typeof accounts)[0]) => {
    setEditingAccount(account.id);
    setName(account.name);
    setType(account.type);
    setBalance(String(account.balance));
    setColor(account.color);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const result = accountSchema.safeParse({
      name,
      type,
      balance: balance ? parseFloat(balance) : 0,
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

    if (editingAccount) {
      await updateAccount.mutateAsync({ id: editingAccount, ...result.data });
    } else {
      await createAccount.mutateAsync(result.data);
    }

    setIsSubmitting(false);
    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedAccount) return;
    await deleteAccount.mutateAsync(selectedAccount);
    setDeleteDialogOpen(false);
    setSelectedAccount(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getAccountIcon = (accountType: string) => {
    const found = accountTypes.find((t) => t.value === accountType);
    return found ? found.icon : Wallet;
  };

  const positiveAccounts = accounts.filter((a) => Number(a.balance) >= 0);
  const negativeAccounts = accounts.filter((a) => Number(a.balance) < 0);
  const positiveTotal = positiveAccounts.reduce(
    (sum, a) => sum + Number(a.balance),
    0,
  );
  const negativeTotal = negativeAccounts.reduce(
    (sum, a) => sum + Number(a.balance),
    0,
  );

  return (
    <DashboardLayout
      title="Accounts"
      description="Manage your financial accounts"
      actions={
        <Button
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-2"
        >
          <Plus size={18} /> Add Account
        </Button>
      }
    >
      <div className="space-y-6">
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingAccount ? 'Edit Account' : 'New Account'}
              </DialogTitle>
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
                  onValueChange={(v) => setType(v as typeof type)}
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
                  {colors.map((c) => (
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-card border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Worth</p>
                  <p
                    className={`text-2xl font-bold font-display ${
                      totalBalance >= 0 ? 'text-foreground' : 'text-destructive'
                    }`}
                  >
                    {formatCurrency(totalBalance)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Wallet className="text-primary-foreground" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Assets</p>
                  <p className="text-2xl font-bold font-display text-success">
                    {formatCurrency(positiveTotal)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <TrendingUp className="text-success" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Liabilities</p>
                  <p className="text-2xl font-bold font-display text-destructive">
                    {formatCurrency(Math.abs(negativeTotal))}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <TrendingDown className="text-destructive" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accounts Grid */}
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display">Your Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet size={48} className="mx-auto mb-4 opacity-50" />
                <p className="mb-4">
                  No accounts yet. Add your first account to get started.
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus size={18} /> Add Account
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map((account) => {
                  const Icon = getAccountIcon(account.type);
                  return (
                    <div
                      key={account.id}
                      className="p-4 rounded-xl border border-border hover:shadow-lg transition-all group relative overflow-hidden"
                    >
                      <div
                        className="absolute top-0 left-0 w-full h-1"
                        style={{ backgroundColor: account.color }}
                      />
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${account.color}20` }}
                          >
                            <Icon style={{ color: account.color }} size={24} />
                          </div>
                          <div>
                            <p className="font-semibold">{account.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {account.type.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(account)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                          >
                            <Edit2
                              size={16}
                              className="text-muted-foreground"
                            />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAccount(account.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 size={16} className="text-destructive" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p
                          className={`text-2xl font-bold font-display ${
                            Number(account.balance) >= 0
                              ? 'text-foreground'
                              : 'text-destructive'
                          }`}
                        >
                          {formatCurrency(Number(account.balance))}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Current Balance
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this account and all associated
              transactions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Accounts;
