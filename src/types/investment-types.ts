import { asPublicId } from '@/lib/public-id';

export type InvestmentType = 'mutual_fund' | 'stock' | 'fd' | 'gold' | 'crypto';

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  invested_amount: number;
  current_value: number;
  account_id: string;
  start_date: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  accounts?: {
    id: string;
    name: string;
  };
}

export interface CreateInvestmentData {
  name: string;
  type: InvestmentType;
  invested_amount: number;
  current_value: number;
  account_id: string;
  start_date: string;
  notes?: string;
}

export interface UpdateInvestmentData extends Partial<CreateInvestmentData> {
  id: string;
}

export interface InvestmentDetail extends Investment {
  linkedTransactions?: Array<{
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    date: string;
  }>;
  linkedDocuments?: Array<{
    id: string;
    name: string;
  }>;
}

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  mutual_fund: 'Mutual Fund',
  stock: 'Stock',
  fd: 'Fixed Deposit',
  gold: 'Gold',
  crypto: 'Cryptocurrency',
};

export const toInvestmentType = (
  investment: any,
  accountMeta?: { id: string; name: string },
): Investment => ({
  id: asPublicId(investment.publicId),
  name: investment.name,
  type: investment.type,
  invested_amount: Number(investment.invested_amount),
  current_value: Number(investment.current_value),
  account_id:
    investment.account?.publicId != null
      ? asPublicId(investment.account.publicId)
      : accountMeta?.id ?? '',
  start_date: investment.start_date?.toISOString(),
  notes: investment.notes,
  created_at: investment.createdAt.toISOString(),
  updated_at: investment.updatedAt.toISOString(),
  ...(accountMeta
      ? { accounts: accountMeta }
    : investment.account
      ? {
          accounts: {
            id: asPublicId(investment.account.publicId),
            name: investment.account.name,
          },
        }
      : {}),
});
