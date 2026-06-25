'use client';

import { useRouter } from 'next/navigation';
import EmptyState from './EmptyState';
import { PaginatedTable, type Column } from '@/components/molecules/common/DataTable';
import { ROUTES } from '@/lib/constants/routes';
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
  const router = useRouter();

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const columns: Column<Transaction>[] = [
    {
      header: 'Date',
      accessor: transaction => formatDate(transaction.date),
    },
    {
      header: 'Description',
      accessor: transaction => (
        <div>
          <div className="font-medium text-foreground">
            {transaction.description || 'No description'}
          </div>
          <div className="text-xs text-muted-foreground">
            {transaction.categories?.name || 'Uncategorized'}
          </div>
        </div>
      ),
    },
    {
      header: 'Account',
      accessor: transaction => transaction.accounts?.name || 'Unknown Account',
    },
    {
      header: 'Amount',
      accessor: transaction => (
        <span className={transaction.type === 'income' ? 'text-success' : 'text-destructive'}>
          {formatAmount(transaction.amount, transaction.type)}
        </span>
      ),
      className: 'text-right',
    },
  ];

  if (!transactions.length && !isLoading) {
    return (
      <div className="rounded-xl border-0 bg-card shadow-card">
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
      onRowClick={transaction => router.push(ROUTES.transaction(transaction.id))}
      footerContent={() => (
        <div className="flex items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="text-destructive">-₹{totalExpenses.toFixed(2)}</span>
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
