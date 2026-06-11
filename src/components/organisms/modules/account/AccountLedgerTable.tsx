'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/atoms/ui/table';
import { calculateLedgerEntries, formatCurrency, formatDateStr } from '@/lib/ledger-utils';
import type { LedgerEntry } from '@/lib/ledger-utils';
import type { Transaction } from '@/types/transaction-types';
import { ArrowLeftRight } from 'lucide-react';

type AccountLedgerTableProps = {
  transactions: Transaction[];
  openingBalance: number;
  currency: string;
  isLoading?: boolean;
  transferPartners?: Record<
    string,
    { transactionId: string; accountId: string; accountName?: string }
  >;
};

const LoadingRow = () => (
  <TableRow>
    <TableCell colSpan={6} className="h-12">
      <div className="flex h-full items-center gap-2">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </div>
    </TableCell>
  </TableRow>
);

export default function AccountLedgerTable({
  transactions,
  openingBalance,
  currency,
  isLoading = false,
  transferPartners,
}: AccountLedgerTableProps) {
  const router = useRouter();

  const ledgerEntries = calculateLedgerEntries(transactions, openingBalance);

  const handleRowClick = (transaction: Transaction) => {
    router.push(`/app/transactions/${transaction.id}`);
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Debit</TableHead>
              <TableHead>Credit</TableHead>
              <TableHead className="text-right">Running Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <LoadingRow key={i} />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-8">
        <div className="text-center">
          <p className="text-muted-foreground">No transactions found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border hover:bg-transparent">
            <TableHead className="w-24">Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-32 text-right">Debit</TableHead>
            <TableHead className="w-32 text-right">Credit</TableHead>
            <TableHead className="w-40 text-right">Running Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Opening Balance Row */}
          <TableRow className="border-b border-border bg-muted/50 hover:bg-muted/70">
            <TableCell colSpan={2} className="text-sm font-semibold">
              Opening Balance
            </TableCell>
            <TableCell className="text-right"></TableCell>
            <TableCell className="text-right"></TableCell>
            <TableCell className="text-right font-semibold">
              {formatCurrency(openingBalance, currency)}
            </TableCell>
          </TableRow>

          {/* Ledger Entries */}
          {ledgerEntries.map((entry: LedgerEntry) => (
            <TableRow
              key={entry.transaction.id}
              className="cursor-pointer border-b border-border transition-colors hover:bg-muted/50"
              onClick={() => handleRowClick(entry.transaction)}
            >
              <TableCell className="text-sm">{formatDateStr(entry.transaction.date)}</TableCell>
              <TableCell>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {entry.transaction.description || 'No description'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.transaction.categories?.name || 'Uncategorized'}
                  </p>
                  {entry.transaction.transfer_id && (
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-primary">
                      <ArrowLeftRight size={14} />
                      <span>
                        Transfer {entry.transaction.type === 'expense' ? 'to' : 'from'}{' '}
                        {transferPartners?.[entry.transaction.transfer_id]?.accountName ||
                          'linked account'}
                      </span>
                      {transferPartners?.[entry.transaction.transfer_id] && (
                        <Link
                          href={`/app/accounts/${transferPartners[entry.transaction.transfer_id].accountId}`}
                          className="font-medium underline-offset-4 hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          View account
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right text-sm">
                {entry.debit > 0 ? (
                  <span className="font-medium text-destructive">
                    {formatCurrency(entry.debit, currency)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right text-sm">
                {entry.credit > 0 ? (
                  <span className="font-medium text-success">
                    {formatCurrency(entry.credit, currency)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell
                className={cn(
                  'text-right text-sm font-semibold',
                  entry.runningBalance < 0 ? 'text-destructive' : 'text-success',
                )}
              >
                {formatCurrency(entry.runningBalance, currency)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
