'use client';

import { formatCurrency } from '@/lib/utils';

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    dataKey?: string;
  }>;
  label?: string;
}

const formatLabel = (name?: string, dataKey?: string) => {
  const key = name || dataKey || 'Value';
  if (key === 'income') return 'Income';
  if (key === 'expenses') return 'Expenses';
  return key;
};

export function ChartTooltipContent({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  if (payload.length > 1) {
    return (
      <div className="rounded-md border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md">
        {label && <p className="mb-1.5 text-xs font-medium text-foreground">{label}</p>}
        <div className="space-y-1">
          {payload.map(item => (
            <div
              key={item.dataKey || item.name}
              className="flex items-center justify-between gap-4 text-xs"
            >
              <span className="text-muted-foreground">
                {formatLabel(item.name, String(item.dataKey))}
              </span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(Number(item.value ?? 0))}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const item = payload[0];
  const itemLabel = formatLabel(item.name, String(item.dataKey));

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="max-w-[160px] truncate text-xs text-muted-foreground">{itemLabel}</p>
      <p className="text-sm font-semibold tabular-nums">
        {formatCurrency(Number(item.value ?? 0))}
      </p>
    </div>
  );
}
