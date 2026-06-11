import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('rounded-xl bg-gradient-to-b from-slate-900 to-slate-800 p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-3 sm:space-x-3 sm:space-y-0',
        month: 'space-y-3',
        caption: 'flex justify-center pt-1 relative items-center mb-3',
        caption_label: 'text-base font-semibold text-white',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 text-white hover:bg-slate-700',
        ),
        nav_button_previous: 'absolute left-0',
        nav_button_next: 'absolute right-0',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex gap-1',
        head_cell:
          'text-muted-foreground rounded-md w-9 font-normal text-[0.75rem] text-slate-400 text-center py-1',
        row: 'flex w-full gap-1',
        cell: 'h-8 w-9 text-center text-xs p-0 relative focus-within:relative focus-within:z-20',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-8 w-9 p-0 font-normal text-white hover:bg-slate-700 rounded-md transition-colors text-sm',
        ),
        day_range_end: 'day-range-end',
        day_selected: 'bg-blue-500 text-white hover:bg-blue-600 focus:bg-blue-600 rounded-md',
        day_today: 'bg-slate-700 text-white font-semibold',
        day_outside: 'day-outside text-slate-500 opacity-40 hover:opacity-60',
        day_disabled: 'text-slate-600 opacity-40',
        day_range_middle: 'aria-selected:bg-slate-700 aria-selected:text-white',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
