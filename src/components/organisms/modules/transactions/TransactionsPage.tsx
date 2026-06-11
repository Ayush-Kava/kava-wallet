'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import TransactionsFilters from './TransactionsFilters';
import TransactionsTable from './TransactionsTable';
import { useTransactions } from '@/hooks/useTransactions';
import { Button } from '@/components/atoms/ui/button';
import { useUiStore } from '@/store/ui/use-ui-store';
import { ArrowLeftRight, Plus } from 'lucide-react';

export default function TransactionsPage() {
  const { openTransactionDialog } = useUiStore();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [accountId, setAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountLabel, setAccountLabel] = useState('All Accounts');
  const [categoryLabel, setCategoryLabel] = useState('All Categories');
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<'Income & Expense' | 'Income' | 'Expense'>(
    'Income & Expense',
  );

  const openWithFilters = (mode?: 'expense' | 'income' | 'transfer') => {
    const dialogMode =
      mode ??
      (selectedType === 'Income' ? 'income' : selectedType === 'Expense' ? 'expense' : 'expense');

    openTransactionDialog({
      mode: dialogMode,
      accountId: accountId ?? undefined,
      categoryId: categoryId ?? undefined,
      preserveAccountOnSave: Boolean(accountId),
    });
  };

  const { transactions, isLoading, totalCount, totalPages } = useTransactions(
    currentPage,
    itemsPerPage,
    {
      accountId: accountId ?? undefined,
      categoryId: categoryId ?? undefined,
      search: search || undefined,
      type: selectedType,
    },
  );

  return (
    <DashboardLayout
      title="Transactions"
      description="Track and manage your income and expenses"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => openWithFilters('transfer')}>
            <ArrowLeftRight size={18} />
            Transfer
          </Button>
          <Button onClick={() => openWithFilters()}>
            <Plus size={18} />
            Add Transaction
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <TransactionsFilters
          selectedAccountId={accountId}
          selectedCategoryId={categoryId}
          selectedType={selectedType}
          search={search}
          accountLabel={accountLabel}
          categoryLabel={categoryLabel}
          onAccountChange={(id, label) => {
            setAccountId(id);
            setAccountLabel(label);
            setCurrentPage(1);
          }}
          onCategoryChange={(id, label) => {
            setCategoryId(id);
            setCategoryLabel(label);
            setCurrentPage(1);
          }}
          onTypeChange={value => {
            setSelectedType(value);
            setCurrentPage(1);
          }}
          onSearchChange={value => {
            setSearch(value);
            setCurrentPage(1);
          }}
        />
        <TransactionsTable
          transactions={transactions}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setCurrentPage}
        />
      </div>
    </DashboardLayout>
  );
}
