'use client';

import { useState } from 'react';
import { Calendar } from '@/components/atoms/ui/calendar';
import { Button } from '@/components/atoms/ui/button';
import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/atoms/ui/popover';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

interface DateRangeCalendarProps {
  onDateRangeChange?: (dateRange: DateRange | undefined) => void;
}

export function DateRangeCalendar({ onDateRangeChange }: DateRangeCalendarProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(dateRange);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleApply = () => {
    setDateRange(tempDateRange);
    setIsPopoverOpen(false);
    onDateRangeChange?.(tempDateRange);
  };

  const handleCancel = () => {
    setTempDateRange(dateRange);
    setIsPopoverOpen(false);
  };

  const getDateRangeLabel = () => {
    if (!dateRange?.from) return 'Select dates';
    if (!dateRange?.to) return format(dateRange.from, 'MMM dd, yyyy');
    return `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`;
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-xs">
          {getDateRangeLabel()}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-2">
          <Calendar
            mode="range"
            selected={tempDateRange}
            onSelect={setTempDateRange}
            disabled={false}
          />
          <div className="mt-3 flex justify-end gap-2 px-2 pb-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
