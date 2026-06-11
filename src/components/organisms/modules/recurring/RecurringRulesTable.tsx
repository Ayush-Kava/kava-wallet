'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { RecurringRule } from '@/types/recurring-types';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowRightCircle, Pause, PencilLine, Play, Trash2 } from 'lucide-react';

const formatDate = (value: string) => format(new Date(value), 'dd MMM yyyy');

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

type RecurringRulesTableProps = {
  rules: RecurringRule[];
  isLoading: boolean;
  onEdit: (rule: RecurringRule) => void;
  onDelete: (ruleId: string) => void;
  onTogglePause: (rule: RecurringRule) => void;
  onRunNow: (rule: RecurringRule) => void;
};

export function RecurringRulesTable({
  rules,
  isLoading,
  onEdit,
  onDelete,
  onTogglePause,
  onRunNow,
}: RecurringRulesTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        Loading recurring rules…
      </div>
    );
  }

  if (!rules.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        No recurring rules yet. Create your first one to automate transactions.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Next Run</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map(rule => {
            const amountLabel = new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 2,
            }).format(rule.amount);

            return (
              <TableRow key={rule.id}>
                <TableCell>
                  <div className="font-medium">{rule.name}</div>
                  {rule.description && (
                    <p className="text-xs text-muted-foreground">{rule.description}</p>
                  )}
                </TableCell>
                <TableCell className="capitalize">{rule.type.replace('_', ' ')}</TableCell>
                <TableCell>{amountLabel}</TableCell>
                <TableCell className="capitalize">{capitalize(rule.frequency)}</TableCell>
                <TableCell>{formatDate(rule.next_run_date)}</TableCell>
                <TableCell>
                  {rule.paused ? (
                    <Badge variant="outline">Paused</Badge>
                  ) : (
                    <Badge variant="secondary">Active</Badge>
                  )}
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRunNow(rule)}
                    aria-label="Run now"
                  >
                    <ArrowRightCircle size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onTogglePause(rule)}
                    aria-label={rule.paused ? 'Resume' : 'Pause'}
                  >
                    {rule.paused ? <Play size={18} /> : <Pause size={18} />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(rule)}
                    aria-label="Edit rule"
                  >
                    <PencilLine size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(rule.id)}
                    aria-label="Delete rule"
                    className="text-destructive"
                  >
                    <Trash2 size={18} />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
