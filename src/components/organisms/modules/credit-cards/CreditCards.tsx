'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useAccounts } from '@/hooks/useAccounts';
import { formatCurrency } from '@/lib/ledger-utils';
import { differenceInCalendarDays, format } from 'date-fns';
import {
  CreditCard,
  Plus,
  Loader2,
  Trash2,
  Edit2,
  ArrowRight,
} from 'lucide-react';

const creditCardSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  balance: z.number().optional(),
  color: z.string().optional(),
  statement_start_date: z.string().min(1, 'Statement start date is required'),
  statement_end_date: z.string().min(1, 'Statement end date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  credit_limit: z.number().positive('Credit limit must be greater than zero'),
  min_due: z.number().min(0, 'Minimum due cannot be negative').optional(),
});

const colors = [
  '#10B981',
  '#06B6D4',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F97316',
  '#FBBF24',
  '#84CC16',
];

export default function CreditCards() {
  const router = useRouter();
  const { accounts, isLoading, createAccount, updateAccount, deleteAccount } =
    useAccounts();

  const creditCards = useMemo(
    () => accounts.filter((account) => account.type === 'credit_card'),
    [accounts],
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState(colors[0]);
  const [statementStart, setStatementStart] = useState('');
  const [statementEnd, setStatementEnd] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [minDue, setMinDue] = useState('');

  const resetForm = () => {
    setName('');
    setBalance('');
    setColor(colors[0]);
    setStatementStart('');
    setStatementEnd('');
    setDueDate('');
    setCreditLimit('');
    setMinDue('');
    setFormErrors({});
    setEditingId(null);
  };

  const handleEdit = (cardId: string) => {
    const card = creditCards.find((c) => c.id === cardId);
    if (!card) return;

    setEditingId(card.id);
    setName(card.name);
    setBalance(String(card.balance ?? 0));
    setColor(card.color || colors[0]);
    setStatementStart(card.statement_start_date || '');
    setStatementEnd(card.statement_end_date || '');
    setDueDate(card.due_date || '');
    setCreditLimit(
      card.credit_limit !== null && card.credit_limit !== undefined
        ? String(card.credit_limit)
        : '',
    );
    setMinDue(
      card.min_due !== null && card.min_due !== undefined
        ? String(card.min_due)
        : '',
    );
    setDialogOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormErrors({});

    const result = creditCardSchema.safeParse({
      name,
      balance: balance ? parseFloat(balance) : 0,
      color,
      statement_start_date: statementStart,
      statement_end_date: statementEnd,
      due_date: dueDate,
      credit_limit: creditLimit ? parseFloat(creditLimit) : undefined,
      min_due: minDue ? parseFloat(minDue) : undefined,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    if (editingId) {
      await updateAccount.mutateAsync({
        id: editingId,
        type: 'credit_card',
        ...result.data,
      });
    } else {
      await createAccount.mutateAsync({ type: 'credit_card', ...result.data });
    }

    setIsSubmitting(false);
    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    await deleteAccount.mutateAsync(selectedId);
    setDeleteDialogOpen(false);
    setSelectedId(null);
  };

  const totalCreditLimit = creditCards.reduce(
    (sum, card) => sum + (card.credit_limit || 0),
    0,
  );

  const upcomingDue = useMemo(() => {
    const withDueDate = creditCards.filter((card) => card.due_date);
    if (!withDueDate.length) return null;

    return withDueDate.sort(
      (a, b) =>
        new Date(a.due_date || '').getTime() -
        new Date(b.due_date || '').getTime(),
    )[0];
  }, [creditCards]);

  const totalAvailable = creditCards.reduce((sum, card) => {
    const limit = card.credit_limit || 0;
    const balanceValue = Number(card.balance || 0);
    return (
      sum + (limit - (balanceValue < 0 ? Math.abs(balanceValue) : balanceValue))
    );
  }, 0);

  return (
    <DashboardLayout
      title="Credit Cards"
      description="Track your cards, statement cycles, and dues."
      actions={
        <Button
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-2"
        >
          <Plus size={18} /> Add Credit Card
        </Button>
      }
    >
      <div className="space-y-6">
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingId ? 'Edit Credit Card' : 'New Credit Card'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Card Name *</Label>
                <Input
                  placeholder="HDFC Millennia"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Opening Balance</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        color === c
                          ? 'ring-2 ring-offset-2 ring-primary scale-110'
                          : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Statement Start Date *</Label>
                  <Input
                    type="date"
                    value={statementStart}
                    onChange={(e) => setStatementStart(e.target.value)}
                  />
                  {formErrors.statement_start_date && (
                    <p className="text-sm text-destructive">
                      {formErrors.statement_start_date}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Statement End Date *</Label>
                  <Input
                    type="date"
                    value={statementEnd}
                    onChange={(e) => setStatementEnd(e.target.value)}
                  />
                  {formErrors.statement_end_date && (
                    <p className="text-sm text-destructive">
                      {formErrors.statement_end_date}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Due Date *</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  {formErrors.due_date && (
                    <p className="text-sm text-destructive">
                      {formErrors.due_date}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Credit Limit *</Label>
                  <Input
                    type="number"
                    placeholder="50000"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    step="0.01"
                    min="0"
                  />
                  {formErrors.credit_limit && (
                    <p className="text-sm text-destructive">
                      {formErrors.credit_limit}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Minimum Due (optional)</Label>
                  <Input
                    type="number"
                    placeholder="Auto-calculated at 5% if empty"
                    value={minDue}
                    onChange={(e) => setMinDue(e.target.value)}
                    step="0.01"
                    min="0"
                  />
                  {formErrors.min_due && (
                    <p className="text-sm text-destructive">
                      {formErrors.min_due}
                    </p>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : editingId ? (
                  'Update Card'
                ) : (
                  'Create Card'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-card border-0">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Cards</p>
              <p className="text-2xl font-display font-bold">
                {creditCards.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total credit cards linked
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Total Credit Limit
              </p>
              <p className="text-2xl font-display font-bold">
                {formatCurrency(totalCreditLimit || 0, 'INR')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sum of all limits
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Available (approx)
              </p>
              <p className="text-2xl font-display font-bold">
                {formatCurrency(totalAvailable || 0, 'INR')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on limits minus balances
              </p>
            </CardContent>
          </Card>
        </div>

        {upcomingDue && (
          <Card className="shadow-card border border-primary/30 bg-primary/5">
            <CardContent className="pt-6 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm text-muted-foreground">Next due</p>
                <p className="text-lg font-semibold">{upcomingDue.name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(upcomingDue.due_date || ''), 'dd MMM yyyy')}
                </p>
              </div>
              <Badge variant="outline">
                {(() => {
                  const days = differenceInCalendarDays(
                    new Date(upcomingDue.due_date || ''),
                    new Date(),
                  );
                  if (Number.isNaN(days)) return 'Set due date';
                  if (days === 0) return 'Due today';
                  if (days < 0) return `${Math.abs(days)} days overdue`;
                  return `${days} days left`;
                })()}
              </Badge>
              <Button
                onClick={() => router.push(`/credit-cards/${upcomingDue.id}`)}
                variant="secondary"
              >
                View details
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display">Your Cards</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : creditCards.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
                <p className="mb-4">
                  No credit cards yet. Add your first card to get started.
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus size={18} /> Add Credit Card
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {creditCards.map((card) => {
                  const dueText = card.due_date
                    ? format(new Date(card.due_date), 'dd MMM')
                    : 'No due date';
                  const available =
                    card.credit_limit !== null &&
                    card.credit_limit !== undefined
                      ? card.credit_limit + Number(card.balance || 0)
                      : null;

                  return (
                    <div
                      key={card.id}
                      className="p-4 rounded-xl border border-border hover:shadow-lg transition-all group relative overflow-hidden"
                      style={{ borderColor: `${card.color || '#10B981'}40` }}
                    >
                      <div
                        className="absolute top-0 left-0 w-full h-1"
                        style={{ backgroundColor: card.color || '#10B981' }}
                      />
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold flex items-center gap-2">
                            <CreditCard size={16} /> {card.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Due {dueText}
                          </p>
                          {card.credit_limit && (
                            <p className="text-xs text-muted-foreground">
                              Limit{' '}
                              {formatCurrency(card.credit_limit, card.currency)}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              router.push(`/credit-cards/${card.id}`)
                            }
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            aria-label="View card"
                          >
                            <ArrowRight size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(card.id)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            aria-label="Edit card"
                          >
                            <Edit2
                              size={16}
                              className="text-muted-foreground"
                            />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedId(card.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                            aria-label="Delete card"
                          >
                            <Trash2 size={16} className="text-destructive" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 space-y-1">
                        <p className="text-2xl font-bold font-display">
                          {formatCurrency(
                            Number(card.balance || 0),
                            card.currency,
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Current balance
                        </p>
                        {available !== null && (
                          <p className="text-xs text-muted-foreground">
                            Approx available{' '}
                            {formatCurrency(available, card.currency)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Credit Card?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this credit card account and all
              associated transactions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
