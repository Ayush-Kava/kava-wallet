'use client';

import { useMemo } from 'react';
import { differenceInCalendarDays, format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useUiStore } from '@/store/ui/use-ui-store';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AccountLedgerTable from '@/components/organisms/modules/account/AccountLedgerTable';
import { useAccountLedger } from '@/hooks/useAccountLedger';
import { accountsApi } from '@/services/api/accounts';
import { formatCurrency, formatDateStr } from '@/lib/ledger-utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, CreditCard } from 'lucide-react';

type CreditCardDetailProps = {
  cardId: string;
};

const toDateOrNull = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export default function CreditCardDetail({ cardId }: CreditCardDetailProps) {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { openTransactionDialog } = useUiStore();
  const { account, transactions, transferPartners, isLoading } = useAccountLedger(cardId);

  const statementWindow = useMemo(() => {
    const start = toDateOrNull(account?.statement_start_date);
    const end = toDateOrNull(account?.statement_end_date);

    if (!start || !end) return null;

    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);

    return { start, end: endOfDay };
  }, [account?.statement_start_date, account?.statement_end_date]);

  const statementTransactions = useMemo(() => {
    if (!statementWindow) return transactions;

    return transactions.filter(transaction => {
      const txDate = new Date(transaction.date);
      return txDate >= statementWindow.start && txDate <= statementWindow.end;
    });
  }, [transactions, statementWindow]);

  const statementTotal = useMemo(
    () =>
      statementTransactions
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0),
    [statementTransactions],
  );

  const paymentTotal = useMemo(
    () =>
      statementTransactions
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0),
    [statementTransactions],
  );

  const outstanding = useMemo(() => statementTotal - paymentTotal, [statementTotal, paymentTotal]);

  const minimumDue = useMemo(() => {
    if (account?.min_due !== null && account?.min_due !== undefined) {
      return account.min_due;
    }
    return Math.max(Number((outstanding * 0.05).toFixed(2)), 0);
  }, [account?.min_due, outstanding]);

  const dueCountdown = useMemo(() => {
    const dueDate = toDateOrNull(account?.due_date);
    if (!dueDate) return null;

    return differenceInCalendarDays(dueDate, new Date());
  }, [account?.due_date]);

  const availableCredit = useMemo(() => {
    if (!account?.credit_limit && account?.credit_limit !== 0) return null;
    return account.credit_limit - outstanding;
  }, [account?.credit_limit, outstanding]);

  const openingBalance = useMemo(() => {
    if (!account) return 0;
    const netActivity = transactions.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);

    return account.balance - netActivity;
  }, [account, transactions]);

  const handlePayBill = async () => {
    const accounts = await queryClient.fetchQuery({
      queryKey: ['accounts', user?.id],
      queryFn: () => accountsApi.getAccounts(),
    });
    const bankAccount = accounts.find(acc => acc.type === 'bank');
    openTransactionDialog({
      mode: 'transfer',
      toAccountId: cardId,
      fromAccountId: bankAccount?.id,
    });
  };

  if (!account && !isLoading) {
    return (
      <DashboardLayout
        title="Credit Card Not Found"
        description="The credit card you're looking for doesn't exist."
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft size={16} />
            Back
          </Button>
        }
      >
        <div className="flex justify-center py-12">
          <Alert variant="destructive" className="max-w-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Card missing</AlertTitle>
            <AlertDescription>
              We couldn&apos;t find that credit card. Please check the URL and try again.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  if (account && account.type !== 'credit_card') {
    return (
      <DashboardLayout
        title="Not a credit card"
        description="This account is not marked as a credit card."
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft size={16} />
            Back
          </Button>
        }
      >
        <div className="flex justify-center py-12">
          <Alert className="max-w-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Wrong account type</AlertTitle>
            <AlertDescription>
              Please open a credit card account to view this page.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={account?.name || 'Credit Card'}
      description="Track statements, dues, and card activity."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft size={16} />
            Back
          </Button>
          <Button onClick={handlePayBill} disabled={!account}>
            <CreditCard size={16} />
            Pay Bill
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {account && statementWindow === null && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Statement dates missing</AlertTitle>
            <AlertDescription>
              Add statement start and end dates to calculate outstanding and minimum due accurately.
            </AlertDescription>
          </Alert>
        )}

        {account && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Outstanding</CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={`font-display text-3xl font-bold ${
                    outstanding > 0 ? 'text-destructive' : 'text-success'
                  }`}
                >
                  {formatCurrency(outstanding, account.currency)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Expenses in statement - payments
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Statement Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl font-bold">
                  {formatCurrency(statementTotal, account.currency)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {statementWindow
                    ? `${formatDateStr(statementWindow.start.toISOString())} - ${formatDateStr(statementWindow.end.toISOString())}`
                    : 'Set statement dates to scope totals'}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">Due Date</CardTitle>
                {account.due_date && (
                  <Badge variant="outline">
                    {format(new Date(account.due_date), 'dd MMM, yyyy')}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                {account.due_date ? (
                  <p
                    className={`font-display text-3xl font-bold ${
                      (dueCountdown ?? 0) < 0 ? 'text-destructive' : 'text-foreground'
                    }`}
                  >
                    {dueCountdown === 0 && 'Due today'}
                    {dueCountdown !== null &&
                      dueCountdown > 0 &&
                      `${dueCountdown} day${dueCountdown === 1 ? '' : 's'}`}
                    {dueCountdown !== null &&
                      dueCountdown < 0 &&
                      `${Math.abs(dueCountdown)} day${
                        Math.abs(dueCountdown) === 1 ? '' : 's'
                      } overdue`}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Set a due date to track countdown.
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Minimum due {formatCurrency(minimumDue, account.currency)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Credit Limit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl font-bold">
                  {account.credit_limit !== null && account.credit_limit !== undefined
                    ? formatCurrency(account.credit_limit, account.currency)
                    : 'Not set'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {availableCredit !== null && availableCredit !== undefined
                    ? `Available ${formatCurrency(availableCredit, account.currency)}`
                    : 'Add a credit limit to see availability'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {account && (
          <div className="rounded-lg border border-border bg-card p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Statement window</p>
                <p className="font-semibold">
                  {statementWindow
                    ? `${formatDateStr(statementWindow.start.toISOString())} - ${formatDateStr(statementWindow.end.toISOString())}`
                    : 'Set statement start and end dates'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {statementWindow && (
                  <Badge variant="secondary">{statementTransactions.length} tx in cycle</Badge>
                )}
                <Badge variant="outline">{transactions.length} total tx</Badge>
              </div>
            </div>
          </div>
        )}

        <AccountLedgerTable
          transactions={transactions}
          openingBalance={openingBalance}
          currency={account?.currency || 'INR'}
          transferPartners={transferPartners}
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
}
