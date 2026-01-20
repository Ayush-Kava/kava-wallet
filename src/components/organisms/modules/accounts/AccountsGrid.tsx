'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Account } from '@/types/account-types';
import {
  Building2,
  CreditCard,
  Edit2,
  Loader2,
  Smartphone,
  Trash2,
  Wallet,
} from 'lucide-react';

const accountTypes = [
  { value: 'cash', label: 'Cash', icon: Wallet },
  { value: 'bank', label: 'Bank Account', icon: Building2 },
  { value: 'credit_card', label: 'Credit Card', icon: CreditCard },
  { value: 'wallet', label: 'Digital Wallet', icon: Smartphone },
];

const formatCurrency = (amount: number, currency: string = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

type AccountsGridProps = {
  accounts: Account[];
  isLoading: boolean;
  onCreateClick: () => void;
  onEdit: (account: Account) => void;
  onDelete: (accountId: string) => void;
  onOpenAccount: (accountId: string) => void;
};

export function AccountsGrid({
  accounts,
  isLoading,
  onCreateClick,
  onEdit,
  onDelete,
  onOpenAccount,
}: AccountsGridProps) {
  const getAccountIcon = (accountType: string) => {
    const found = accountTypes.find((type) => type.value === accountType);
    return found ? found.icon : Wallet;
  };

  if (isLoading) {
    return (
      <Card className="shadow-card border-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!accounts.length) {
    return (
      <Card className="shadow-card border-0">
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Wallet size={48} className="mx-auto mb-4 opacity-50" />
            <p className="mb-4">No accounts yet. Add your first account.</p>
            <Button onClick={onCreateClick}>Add Account</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="font-display">Your Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const Icon = getAccountIcon(account.type);
            return (
              <div
                key={account.id}
                onClick={() => onOpenAccount(account.id)}
                className="p-4 rounded-xl border border-border hover:shadow-lg transition-all group relative overflow-hidden cursor-pointer"
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
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit(account);
                      }}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                      aria-label="Edit account"
                    >
                      <Edit2 size={16} className="text-muted-foreground" />
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(account.id);
                      }}
                      className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                      aria-label="Delete account"
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
                    {formatCurrency(Number(account.balance), account.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current Balance
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
