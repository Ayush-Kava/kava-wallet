'use client';

import { DateRangeCalendar } from '@/components/molecules/common/DateRangeCalendar';
import { Button } from '@/components/atoms/ui/button';
import { X } from 'lucide-react';
import { DateRange } from 'react-day-picker';

type AccountLedgerFiltersProps = {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date?: Date) => void;
  onEndDateChange: (date?: Date) => void;
  onReset: () => void;
};

export default function AccountLedgerFilters({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onReset,
}: AccountLedgerFiltersProps) {
  const hasActiveFilters = startDate || endDate;

  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    onStartDateChange(dateRange?.from);
    onEndDateChange(dateRange?.to);
  };

  return (
    <div className="flex items-center gap-2">
      <DateRangeCalendar onDateRangeChange={handleDateRangeChange} />

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-10 w-10 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
