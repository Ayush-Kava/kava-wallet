export type InvestmentType = 'mutual_fund' | 'stock' | 'fd' | 'gold' | 'crypto';

export interface Investment {
  id: string;
  user_id: string;
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
