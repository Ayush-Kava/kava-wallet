import type { Transaction } from '@/types/transaction-types';

export interface LedgerEntry {
  transaction: Transaction;
  debit: number;
  credit: number;
  runningBalance: number;
}

/**
 * Calculates ledger entries with running balance from transactions
 * @param transactions - Array of transactions
 * @param openingBalance - Starting balance of the account
 * @returns Array of ledger entries with debit/credit and running balance
 */
export const calculateLedgerEntries = (
  transactions: Transaction[],
  openingBalance: number,
): LedgerEntry[] => {
  let runningBalance = openingBalance;

  return transactions.map(transaction => {
    const debit = transaction.type === 'expense' ? transaction.amount : 0;
    const credit = transaction.type === 'income' ? transaction.amount : 0;

    runningBalance = runningBalance + credit - debit;

    return {
      transaction,
      debit,
      credit,
      runningBalance,
    };
  });
};

/**
 * Formats amount as currency with proper styling
 * @param amount - Amount to format
 * @param currency - Currency code (default: INR)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return Math.abs(amount).toLocaleString('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  });
};

/**
 * Formats date consistently across the application
 * @param dateString - Date string to format
 * @returns Formatted date string
 */
export const formatDateStr = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Filters transactions by date range
 * @param transactions - Array of transactions to filter
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns Filtered transactions
 */
export const filterTransactionsByDateRange = (
  transactions: Transaction[],
  startDate?: Date,
  endDate?: Date,
): Transaction[] => {
  if (!startDate && !endDate) {
    return transactions;
  }

  return transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);

    if (startDate && transactionDate < startDate) {
      return false;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (transactionDate > end) {
        return false;
      }
    }

    return true;
  });
};
