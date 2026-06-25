'use client';

import { useState } from 'react';
import { AppLink } from '@/components/atoms/AppLink';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoalForm } from './GoalForm';
import { useGoals } from '@/hooks/useGoals';
import { useAccounts } from '@/hooks/useAccounts';
import { useInvestments } from '@/hooks/useInvestments';
import type { UpdateGoalData, CreateGoalData, CreateGoalFundingData } from '@/types/goal-types';
import { GOAL_PRIORITY_LABELS, GOAL_PRIORITY_COLORS, GOAL_STATUS_LABELS } from '@/types/goal-types';
import type { GoalStatus } from '@/types/goal-types';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  PiggyBank,
  TrendingUp,
  Plus,
  Wallet,
  Target,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import { formatDateStr } from '@/lib/ledger-utils';
import { ROUTES } from '@/lib/constants/routes';

interface GoalDetailProps {
  goalId: string;
}

interface GoalAddFundingFormProps {
  onSubmit: (payload: CreateGoalFundingData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  goalId: string;
}

function GoalAddFundingForm({
  onSubmit,
  onCancel,
  isSubmitting,
  goalId,
}: GoalAddFundingFormProps) {
  const { accounts } = useAccounts();
  const { investments } = useInvestments();
  const [fundingForm, setFundingForm] = useState<{
    source_type: 'account' | 'investment';
    source_id: string;
    allocated_amount: number;
  }>({
    source_type: 'account',
    source_id: '',
    allocated_amount: 0,
  });

  const handleAddFunding = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      goal_id: goalId,
      source_type: fundingForm.source_type,
      source_id: fundingForm.source_id,
      allocated_amount: fundingForm.allocated_amount,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleAddFunding}>
      <div className="space-y-2">
        <Label>Source Type *</Label>
        <Select
          value={fundingForm.source_type}
          onValueChange={(value: 'account' | 'investment') =>
            setFundingForm(prev => ({
              ...prev,
              source_type: value,
              source_id: '',
            }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="account">Bank Account</SelectItem>
            <SelectItem value="investment">Investment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{fundingForm.source_type === 'account' ? 'Account' : 'Investment'} *</Label>
        <Select
          value={fundingForm.source_id}
          onValueChange={value => setFundingForm(prev => ({ ...prev, source_id: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${fundingForm.source_type}`} />
          </SelectTrigger>
          <SelectContent>
            {fundingForm.source_type === 'account'
              ? accounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} (₹{acc.balance.toLocaleString('en-IN')})
                  </SelectItem>
                ))
              : investments.map(inv => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.name} (₹
                    {inv.current_value.toLocaleString('en-IN')})
                  </SelectItem>
                ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Allocated Amount *</Label>
        <Input
          type="number"
          placeholder="0.00"
          step="0.01"
          min="0"
          value={fundingForm.allocated_amount || ''}
          onChange={e =>
            setFundingForm(prev => ({
              ...prev,
              allocated_amount: parseFloat(e.target.value) || 0,
            }))
          }
          required
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            'Add Funding'
          )}
        </Button>
      </div>
    </form>
  );
}

export default function GoalDetail({ goalId }: GoalDetailProps) {
  const router = useRouter();
  const {
    useGoal,
    updateGoal,
    deleteGoal,
    addFunding,
    removeFunding,
    isUpdatingGoal,
    isDeletingGoal,
    isAddingFunding,
  } = useGoals();
  const { data: goal, isLoading } = useGoal(goalId);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [fundingDialogOpen, setFundingDialogOpen] = useState(false);

  const handleUpdate = async (data: CreateGoalData | UpdateGoalData) => {
    await updateGoal({
      id: goalId,
      ...data,
    } as UpdateGoalData);
    setEditOpen(false);
  };

  const handleDelete = async () => {
    await deleteGoal(goalId);
    router.push('/app/goals');
  };

  const handleAddFunding = async (payload: CreateGoalFundingData) => {
    await addFunding(payload);
    setFundingDialogOpen(false);
  };

  const handleRemoveFunding = async (fundingId: string) => {
    await removeFunding(fundingId);
  };

  const handleStatusChange = async (status: GoalStatus) => {
    await updateGoal({ id: goalId, status });
  };

  if (isLoading || !goal) {
    return (
      <DashboardLayout title="Goal Details" description="Loading…">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading goal details…
        </div>
      </DashboardLayout>
    );
  }

  const isOverdue = new Date(goal.target_date) < new Date() && goal.status === 'active';
  const daysRemaining = Math.ceil(
    (new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <DashboardLayout
      title={goal.name}
      description={`Target: ₹${goal.target_amount.toLocaleString('en-IN')} by ${formatDateStr(goal.target_date)}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <AppLink href={ROUTES.goals} className="gap-2">
              <ArrowLeft size={16} /> Back
            </AppLink>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            disabled={isUpdatingGoal}
            className="gap-2"
          >
            <Pencil size={16} /> Edit
          </Button>
          {goal.status === 'active' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('completed')}
                disabled={isUpdatingGoal}
                className="gap-2"
              >
                <CheckCircle2 size={16} /> Mark Complete
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('paused')}
                disabled={isUpdatingGoal}
                className="gap-2"
              >
                <PauseCircle size={16} /> Pause
              </Button>
            </>
          )}
          {goal.status === 'paused' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('active')}
              disabled={isUpdatingGoal}
              className="gap-2"
            >
              <PlayCircle size={16} /> Resume
            </Button>
          )}
          {goal.status === 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('active')}
              disabled={isUpdatingGoal}
              className="gap-2"
            >
              <PlayCircle size={16} /> Reopen
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            disabled={isDeletingGoal}
            className="gap-2"
          >
            <Trash2 size={16} /> Delete
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Progress Card */}
        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-xl">Goal Progress</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={GOAL_PRIORITY_COLORS[goal.priority]}>
                  {GOAL_PRIORITY_LABELS[goal.priority]}
                </Badge>
                <Badge variant="secondary">{GOAL_STATUS_LABELS[goal.status]}</Badge>
                {isOverdue && <Badge variant="destructive">Overdue</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {goal.progress_percentage.toFixed(1)}% Complete
                </span>
                <Target size={20} className="text-muted-foreground" />
              </div>
              <Progress value={goal.progress_percentage} className="h-3" />
            </div>

            <Separator />

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="mb-1 text-xs text-muted-foreground">Target Amount</p>
                <p className="text-xl font-bold">₹{goal.target_amount.toLocaleString('en-IN')}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-950">
                <p className="mb-1 text-xs text-muted-foreground">Saved</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-300">
                  ₹{goal.total_saved.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="mb-1 text-xs text-muted-foreground">Remaining</p>
                <p className="text-xl font-bold">
                  ₹{Math.max(0, goal.remaining).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {!isOverdue && daysRemaining > 0 && (
              <div className="text-center text-sm text-muted-foreground">
                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining until target date
              </div>
            )}

            {goal.notes && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm">{goal.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Funding Sources */}
        <Card className="border-border/70 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-base">Funding Sources</CardTitle>
            <Button
              onClick={() => setFundingDialogOpen(true)}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <Plus size={16} /> Add Funding
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Accounts */}
            {goal.accounts && goal.accounts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Wallet size={16} />
                  Bank Accounts
                </div>
                {goal.accounts.map(account => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                  >
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Balance: ₹{account.balance.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        ₹{account.allocated.toLocaleString('en-IN')}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const funding = goal.funding.find(
                            f => f.source_id === account.id && f.source_type === 'account',
                          );
                          if (funding) handleRemoveFunding(funding.id);
                        }}
                        className="text-xs text-destructive hover:text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Investments */}
            {goal.investments && goal.investments.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp size={16} />
                  Investments
                </div>
                {goal.investments.map(investment => (
                  <div
                    key={investment.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                  >
                    <div>
                      <p className="font-medium">{investment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Value: ₹{investment.current_value.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        ₹{investment.allocated.toLocaleString('en-IN')}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const funding = goal.funding.find(
                            f => f.source_id === investment.id && f.source_type === 'investment',
                          );
                          if (funding) handleRemoveFunding(funding.id);
                        }}
                        className="text-xs text-destructive hover:text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {goal.funding.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                <PiggyBank className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <p>No funding sources yet. Add accounts or investments to track progress.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <GoalForm
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleUpdate}
        isSubmitting={isUpdatingGoal}
        initialData={goal}
        mode="edit"
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this goal? This will also remove all funding
              associations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingGoal ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Funding Dialog */}
      <Dialog open={fundingDialogOpen} onOpenChange={setFundingDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add Funding Source</DialogTitle>
            <DialogDescription>Link an account or investment to this goal</DialogDescription>
          </DialogHeader>
          {fundingDialogOpen ? (
            <GoalAddFundingForm
              goalId={goalId}
              onSubmit={handleAddFunding}
              onCancel={() => setFundingDialogOpen(false)}
              isSubmitting={isAddingFunding}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
