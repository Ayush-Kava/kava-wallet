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

export function AccountsSummary({
  totalBalance,
  assets,
  liabilities,
}: AccountsSummaryProps) {
  return (
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
                {formatCurrency(assets)}
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
                {formatCurrency(Math.abs(liabilities))}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="text-destructive" size={24} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
