'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InvestmentForm } from './InvestmentForm';
import { InvestmentCard } from './InvestmentCard';
import { useInvestments } from '@/hooks/useInvestments';
import { Plus, TrendingUp } from 'lucide-react';
import type {
  CreateInvestmentData,
  UpdateInvestmentData,
  InvestmentType,
} from '@/types/investment-types';
import { INVESTMENT_TYPE_LABELS } from '@/types/investment-types';

const INVESTMENT_TYPES: InvestmentType[] = ['mutual_fund', 'stock', 'fd', 'gold', 'crypto'];

export default function InvestmentsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<InvestmentType | 'all'>('all');
  const {
    investments,
    isLoading,
    createInvestment,
    isCreatingInvestment,
    totalInvested,
    totalCurrentValue,
  } = useInvestments();

  const filteredInvestments =
    selectedType === 'all' ? investments : investments.filter(inv => inv.type === selectedType);

  const handleCreateInvestment = async (data: CreateInvestmentData | UpdateInvestmentData) => {
    // Only pass data that's valid for creating a new investment
    if ('id' in data) {
      // This is an update, filter out the id
      const createData: CreateInvestmentData = {
        name: data.name!,
        type: data.type!,
        invested_amount: data.invested_amount!,
        current_value: data.current_value!,
        account_id: data.account_id!,
        start_date: data.start_date!,
        notes: data.notes,
      };
      await createInvestment(createData);
    } else {
      await createInvestment(data as CreateInvestmentData);
    }
  };

  const totalReturns = totalCurrentValue - totalInvested;
  const returnPercentage =
    totalInvested > 0 ? ((totalReturns / totalInvested) * 100).toFixed(2) : '0.00';

  return (
    <DashboardLayout
      title="Investments"
      description="Track and manage your investment portfolio"
      actions={
        <Button onClick={() => setFormOpen(true)}>
          <Plus size={18} />
          Add Investment
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Portfolio Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/70 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Invested
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₹{totalInvested.toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₹{totalCurrentValue.toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>

          <Card
            className={`border-border/70 shadow-card ${
              totalReturns >= 0 ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'
            }`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Returns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p
                  className={`text-2xl font-bold ${
                    totalReturns >= 0
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {totalReturns >= 0 ? '+' : ''}₹{Math.abs(totalReturns).toLocaleString('en-IN')}
                </p>
                <p
                  className={`text-sm font-semibold ${
                    totalReturns >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {totalReturns >= 0 ? '+' : ''}
                  {returnPercentage}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedType === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedType('all')}
          >
            All Types ({investments.length})
          </Badge>
          {INVESTMENT_TYPES.map(type => {
            const count = investments.filter(inv => inv.type === type).length;
            return (
              <Badge
                key={type}
                variant={selectedType === type ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedType(type)}
              >
                {INVESTMENT_TYPE_LABELS[type]} ({count})
              </Badge>
            );
          })}
        </div>

        {/* Investments Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="h-64">
                <CardContent className="h-full animate-pulse bg-muted" />
              </Card>
            ))}
          </div>
        ) : filteredInvestments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="mb-2 h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                {selectedType === 'all'
                  ? 'No investments yet. Start tracking your portfolio!'
                  : `No ${INVESTMENT_TYPE_LABELS[selectedType]} found.`}
              </p>
              {selectedType === 'all' && (
                <Button onClick={() => setFormOpen(true)} className="mt-4" variant="default">
                  Add Your First Investment
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredInvestments.map(investment => (
              <InvestmentCard key={investment.id} investment={investment} />
            ))}
          </div>
        )}
      </div>

      <InvestmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateInvestment}
        isSubmitting={isCreatingInvestment}
      />
    </DashboardLayout>
  );
}
