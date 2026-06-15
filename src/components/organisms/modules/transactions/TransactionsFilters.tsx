'use client';

import { DateRangeCalendar } from '@/components/molecules/common/DateRangeCalendar';
import { SearchInput } from '@/components/molecules/common/SearchInput';
import { DropdownButton, type DropdownButtonItem } from '@/components/atoms/DropdownButton';
import { Button } from '@/components/atoms/ui/button';
import { ChevronDown } from 'lucide-react';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { CategoryIcon } from '@/components/molecules/categories/CategoryIcon';

type TransactionsFiltersProps = {
  selectedAccountId: string | null;
  selectedCategoryId: string | null;
  selectedType: 'Income & Expense' | 'Income' | 'Expense';
  search: string;
  onAccountChange: (id: string | null, label: string) => void;
  onCategoryChange: (id: string | null, label: string) => void;
  onTypeChange: (value: 'Income & Expense' | 'Income' | 'Expense') => void;
  onSearchChange: (value: string) => void;
  accountLabel: string;
  categoryLabel: string;
};

export default function TransactionsFilters({
  selectedType,
  search,
  onAccountChange,
  onCategoryChange,
  onTypeChange,
  onSearchChange,
  accountLabel,
  categoryLabel,
}: TransactionsFiltersProps) {
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const accountItems: DropdownButtonItem[] = [
    {
      id: 'all-accounts',
      label: 'All Accounts',
      onClick: () => onAccountChange(null, 'All Accounts'),
    },
    ...(accounts || []).map(account => ({
      id: account.id,
      label: account.name,
      onClick: () => onAccountChange(account.id, account.name),
    })),
  ];

  const categoryItems: DropdownButtonItem[] = [
    {
      id: 'all-categories',
      label: 'All Categories',
      onClick: () => onCategoryChange(null, 'All Categories'),
    },
    ...(categories || []).map(category => ({
      id: category.id,
      label: category.name,
      icon: <CategoryIcon icon={category.icon} color={category.color} size="sm" />,
      onClick: () => onCategoryChange(category.id, category.name),
    })),
  ];

  const typeItems: DropdownButtonItem[] = [
    {
      id: 'all-types',
      label: 'Income & Expense',
      onClick: () => onTypeChange('Income & Expense'),
    },
    { id: 'income', label: 'Income', onClick: () => onTypeChange('Income') },
    { id: 'expense', label: 'Expense', onClick: () => onTypeChange('Expense') },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
      <DateRangeCalendar />
      <DropdownButton
        trigger={
          <Button variant="outline" className="gap-2">
            {accountLabel}
            <ChevronDown size={16} />
          </Button>
        }
        items={accountItems}
        align="start"
      />
      <DropdownButton
        trigger={
          <Button variant="outline" className="gap-2">
            {categoryLabel}
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
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search transactions..."
        className="max-w-xs flex-1"
      />
    </div>
  );
}
