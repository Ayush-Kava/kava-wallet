import { asPublicId } from '@/lib/public-id';

export type AccountType = 'cash' | 'bank' | 'credit_card' | 'wallet';

export interface Bank {
  id: string;
  name: string;
  ifsc_prefix: string | null;
  is_active: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string;
  icon: string;
  // Bank-specific
  bank_id?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  // Wallet-specific
  provider?: string | null;
  // Credit card-specific
  card_number?: string | null;
  card_holder_name?: string | null;
  expiry_date?: string | null;
  statement_start_date?: string | null;
  statement_end_date?: string | null;
  due_date?: string | null;
  credit_limit?: number | null;
  min_due?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBankAccountData {
  type: 'bank';
  name: string;
  bank_id: string;
  account_number: string;
  ifsc_code: string;
  balance?: number;
  currency?: string;
  color?: string;
  icon?: string;
}

export interface CreateCashAccountData {
  type: 'cash';
  name: string;
  balance?: number;
  currency?: string;
  color?: string;
  icon?: string;
}

export interface CreateWalletAccountData {
  type: 'wallet';
  name: string;
  provider?: string;
  balance?: number;
  currency?: string;
  color?: string;
  icon?: string;
}

export interface CreateCreditCardData {
  type: 'credit_card';
  name: string;
  bank_id?: string;
  card_number: string;
  card_holder_name?: string;
  expiry_date: string;
  credit_limit: number;
  balance?: number;
  min_due?: number;
  statement_start_date: string;
  statement_end_date: string;
  due_date: string;
  currency?: string;
  color?: string;
  icon?: string;
}

export type CreateAccountData =
  | CreateBankAccountData
  | CreateCashAccountData
  | CreateWalletAccountData
  | CreateCreditCardData;

export const toBankType = (bank: {
  publicId: string;
  name: string;
  ifscPrefix: string | null;
  isActive: boolean;
}): Bank => ({
  id: asPublicId(bank.publicId),
  name: bank.name,
  ifsc_prefix: bank.ifscPrefix,
  is_active: bank.isActive,
});
