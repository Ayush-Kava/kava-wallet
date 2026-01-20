'use client';

import EmptyState from './EmptyState';
import Link from 'next/link';
import {
  PaginatedTable,
  type Column,
} from '@/components/molecules/common/DataTable';
import type { Transaction } from '@/types/transaction-types';

type TransactionsTableProps = {
  transactions: Transaction[];
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatAmount = (amount: number, type: 'income' | 'expense') => {
  const formatted = Math.abs(amount).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });

  return `${type === 'income' ? '+' : '-'} ${formatted}`;
};

export default function TransactionsTable({
  transactions,
  isLoading = false,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}: TransactionsTableProps) {
  // Calculate totals
  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const columns: Column<Transaction>[] = [
    {
      header: 'Date',
      accessor: (transaction) => (
        <Link
          href={`/transactions/${transaction.id}`}
          className="hover:underline"
        >
          {formatDate(transaction.date)}
        </Link>
      ),
    },
    {
      header: 'Description',
      accessor: (transaction) => (
        <Link
          href={`/transactions/${transaction.id}`}
          className="hover:underline"
        >
          <div>
            <div className="font-medium text-foreground">
              {transaction.description || 'No description'}
            </div>
            <div className="text-xs text-muted-foreground">
              {transaction.categories?.name || 'Uncategorized'}
            </div>
          </div>
        </Link>
      ),
    },
    {
      header: 'Account',
      accessor: (transaction) => (
        <Link
          href={`/transactions/${transaction.id}`}
          className="hover:underline"
        >
          {transaction.accounts?.name || 'Unknown Account'}
        </Link>
      ),
    },
    {
      header: 'Amount',
      accessor: (transaction) => (
        <Link
          href={`/transactions/${transaction.id}`}
          className="hover:underline"
        >
          <span
            className={
              transaction.type === 'income'
                ? 'text-success'
                : 'text-destructive'
            }
          >
            {formatAmount(transaction.amount, transaction.type)}
          </span>
        </Link>
      ),
      className: 'text-right',
    },
  ];

  if (!transactions.length && !isLoading) {
    return (
      <div className="bg-card shadow-card border-0 rounded-xl">
        <EmptyState />
      </div>
    );
  }

  return (
    <PaginatedTable
      data={transactions}
      columns={columns}
      itemsPerPage={7}
      showPagination={true}
      isLoading={isLoading}
      loadingRows={5}
      currentPage={currentPage}
      totalPages={totalPages}
      totalCount={totalCount}
      onPageChange={onPageChange}
      footerContent={() => (
        <div className="flex items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="text-destructive">
              -₹{totalExpenses.toFixed(2)}
            </span>
          </div>
          <span className="text-muted-foreground">+</span>
          <div className="flex items-center gap-2">
            <span className="text-success">+₹{totalIncome.toFixed(2)}</span>
          </div>
        </div>
      )}
    />
  );
}
