'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import TransactionsFilters from './TransactionsFilters';
import TransactionsTable from './TransactionsTable';
import { useTransactions } from '@/hooks/useTransactions';
import { Button } from '@/components/atoms/ui/button';
import Link from 'next/link';
import { ArrowLeftRight, Plus } from 'lucide-react';

export default function TransactionsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const [selectedAccount, setSelectedAccount] = useState('All Accounts');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedType, setSelectedType] = useState<
    'Income & Expense' | 'Income' | 'Expense'
  >('Income & Expense');

  const { transactions, isLoading, totalCount, totalPages } = useTransactions(
    currentPage,
    itemsPerPage,
    {
      account: selectedAccount,
      category: selectedCategory,
      type: selectedType,
    },
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAccountChange = (value: string) => {
    setSelectedAccount(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  const handleTypeChange = (
    value: 'Income & Expense' | 'Income' | 'Expense',
  ) => {
    setSelectedType(value);
    setCurrentPage(1);
  };

  return (
    <DashboardLayout
      title="Transactions"
      description="Track and manage your income and expenses"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/transactions/new?type=transfer">
              <ArrowLeftRight size={18} />
              Transfer
            </Link>
          </Button>
          <Button asChild>
            <Link href="/transactions/new">
              <Plus size={18} />
              Add Transaction
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <TransactionsFilters
          selectedAccount={selectedAccount}
          selectedCategory={selectedCategory}
          selectedType={selectedType}
          onAccountChange={handleAccountChange}
          onCategoryChange={handleCategoryChange}
          onTypeChange={handleTypeChange}
        />
        <TransactionsTable
          transactions={transactions}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={handlePageChange}
        />
      </div>
    </DashboardLayout>
  );
}
