import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Investment } from '@/types/investment-types';
import { INVESTMENT_TYPE_LABELS } from '@/types/investment-types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface InvestmentCardProps {
  investment: Investment;
}

const getInvestmentTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    mutual_fund:
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    stock: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    fd: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    gold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    crypto:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  };
  return colorMap[type] || 'bg-gray-100 text-gray-800';
};

export function InvestmentCard({ investment }: InvestmentCardProps) {
  const returns = investment.current_value - investment.invested_amount;
  const returnPercentage = (
    (returns / investment.invested_amount) *
    100
  ).toFixed(2);
  const isPositive = returns >= 0;

  return (
    <Link href={`/investments/${investment.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-1">
                {investment.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {investment.accounts?.name || 'Unknown Account'}
              </p>
            </div>
            <Badge className={getInvestmentTypeColor(investment.type)}>
              {
                INVESTMENT_TYPE_LABELS[
                  investment.type as keyof typeof INVESTMENT_TYPE_LABELS
                ]
              }
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Invested</p>
              <p className="text-sm font-semibold">
                ₹{investment.invested_amount.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Value</p>
              <p className="text-sm font-semibold">
                ₹{investment.current_value.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div
            className={`p-2 rounded ${isPositive ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}
          >
            <div className="flex items-center gap-2">
              {isPositive ? (
                <TrendingUp
                  size={16}
                  className="text-green-600 dark:text-green-400"
                />
              ) : (
                <TrendingDown
                  size={16}
                  className="text-red-600 dark:text-red-400"
                />
              )}
              <div>
                <p
                  className={`text-xs font-semibold ${isPositive ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}
                >
                  {isPositive ? '+' : ''} ₹
                  {Math.abs(returns).toLocaleString('en-IN')}
                </p>
                <p
                  className={`text-xs ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  {isPositive ? '+' : ''}
                  {returnPercentage}%
                </p>
              </div>
            </div>
          </div>

          {investment.notes && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {investment.notes}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
