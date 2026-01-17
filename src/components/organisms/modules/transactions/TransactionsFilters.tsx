'use client';

import { DateRangeCalendar } from '@/components/molecules/common/DateRangeCalendar';
import {
  DropdownButton,
  type DropdownButtonItem,
} from '@/components/atoms/DropdownButton';
import { Input } from '@/components/atoms/ui/input';
import { Button } from '@/components/atoms/ui/button';
import { ChevronDown } from 'lucide-react';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';

type TransactionsFiltersProps = {
  selectedAccount: string;
  selectedCategory: string;
  selectedType: 'Income & Expense' | 'Income' | 'Expense';
  onAccountChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTypeChange: (value: 'Income & Expense' | 'Income' | 'Expense') => void;
};

export default function TransactionsFilters({
  selectedAccount,
  selectedCategory,
  selectedType,
  onAccountChange,
  onCategoryChange,
  onTypeChange,
}: TransactionsFiltersProps) {
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const accountItems: DropdownButtonItem[] = [
    {
      id: 'all-accounts',
      label: 'All Accounts',
      onClick: () => onAccountChange('All Accounts'),
    },
    ...(accounts || []).map((account) => ({
      id: account.id,
      label: account.name,
      onClick: () => onAccountChange(account.name),
    })),
  ];

  const categoryItems: DropdownButtonItem[] = [
    {
      id: 'all-categories',
      label: 'All Categories',
      onClick: () => onCategoryChange('All Categories'),
    },
    ...(categories || []).map((category) => ({
      id: category.id,
      label: category.name,
      onClick: () => onCategoryChange(category.name),
    })),
  ];

  const typeItems: DropdownButtonItem[] = [
    {
      id: 'all-types',
      label: 'Income & Expense',
      onClick: () => onTypeChange('Income & Expense'),
    },
    {
      id: 'income',
      label: 'Income',
      onClick: () => onTypeChange('Income'),
    },
    {
      id: 'expense',
      label: 'Expense',
      onClick: () => onTypeChange('Expense'),
    },
  ];

  return (
    <div className="bg-card shadow-card border-0 p-4 rounded-xl flex flex-wrap gap-3 items-center">
      <DateRangeCalendar />

      <DropdownButton
        trigger={
          <Button variant="outline" className="gap-2">
            {selectedAccount}
            <ChevronDown size={16} />
          </Button>
        }
        items={accountItems}
        align="start"
      />

      <DropdownButton
        trigger={
          <Button variant="outline" className="gap-2">
            {selectedCategory}
            <ChevronDown size={16} />
          </Button>
        }
        items={categoryItems}
        align="start"
      />

      <DropdownButton
        trigger={
          <Button variant="outline" className="gap-2">
            {selectedType}
            <ChevronDown size={16} />
          </Button>
        }
        items={typeItems}
        align="start"
      />

      <Input placeholder="Search…" className="flex-1 max-w-xs" />
    </div>
  );
}
