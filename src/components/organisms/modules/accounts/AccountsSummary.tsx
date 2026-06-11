'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

type AccountsSummaryProps = {
  totalBalance: number;
  assets: number;
  liabilities: number;
};

export function AccountsSummary({ totalBalance, assets, liabilities }: AccountsSummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card className="border-0 shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Net Worth</p>
              <p
                className={`font-display text-2xl font-bold ${
                  totalBalance >= 0 ? 'text-foreground' : 'text-destructive'
                }`}
              >
                {formatCurrency(totalBalance)}
              </p>
            </div>
            <div className="gradient-primary flex h-12 w-12 items-center justify-center rounded-xl">
              <Wallet className="text-primary-foreground" size={24} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Assets</p>
              <p className="font-display text-2xl font-bold text-success">
                {formatCurrency(assets)}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <TrendingUp className="text-success" size={24} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Liabilities</p>
              <p className="font-display text-2xl font-bold text-destructive">
                {formatCurrency(Math.abs(liabilities))}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
              <TrendingDown className="text-destructive" size={24} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
