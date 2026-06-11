'use client';

import { useRef, useState } from 'react';

import { useDebouncedCallback } from 'use-debounce';

import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';

import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;

  onChange: (value: string) => void;

  placeholder?: string;

  debounceMs?: number;

  className?: string;
}

export const SearchInput = ({
  value,

  onChange,

  placeholder = 'Search...',

  debounceMs = 300,

  className,
}: SearchInputProps) => {
  const [localValue, setLocalValue] = useState(value);

  const lastEmittedRef = useRef(value);

  if (value !== lastEmittedRef.current && value !== localValue) {
    lastEmittedRef.current = value;

    setLocalValue(value);
  }

  const debouncedOnChange = useDebouncedCallback((next: string) => {
    lastEmittedRef.current = next;

    onChange(next);
  }, debounceMs);

  return (
    <div className={cn('relative', className)}>
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />

      <Input
        value={localValue}
        onChange={e => {
          const next = e.target.value;

          setLocalValue(next);

          debouncedOnChange(next);
        }}
        placeholder={placeholder}
        className="pl-9"
        aria-label={placeholder}
      />
    </div>
  );
};
