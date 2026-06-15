'use client';

import type { ReactNode } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoryOption } from '@/components/molecules/categories/CategoryOption';
import type { Category } from '@/types/category-types';

interface CategorySelectProps {
  categories: Category[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  noneValue?: string;
  noneLabel?: string;
  triggerClassName?: string;
  disabled?: boolean;
  extraItems?: ReactNode;
}

export function CategorySelect({
  categories,
  value,
  onValueChange,
  placeholder = 'Select category',
  noneValue,
  noneLabel = 'No category',
  triggerClassName,
  disabled,
  extraItems,
}: CategorySelectProps) {
  const selected = categories.find(c => c.id === value);

  return (
    <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={triggerClassName}>
        {selected ? (
          <CategoryOption
            className="min-w-0 flex-1"
            name={selected.name}
            icon={selected.icon}
            color={selected.color}
          />
        ) : (
          <SelectValue placeholder={placeholder} />
        )}
      </SelectTrigger>
      <SelectContent>
        {extraItems}
        {noneValue !== undefined && <SelectItem value={noneValue}>{noneLabel}</SelectItem>}
        {categories.map(cat => (
          <SelectItem key={cat.id} value={cat.id}>
            <CategoryOption name={cat.name} icon={cat.icon} color={cat.color} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
