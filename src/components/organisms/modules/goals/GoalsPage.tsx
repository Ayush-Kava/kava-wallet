'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GoalForm } from './GoalForm';
import { GoalCard } from './GoalCard';
import { useGoals } from '@/hooks/useGoals';
import { Plus, Target } from 'lucide-react';
import type { CreateGoalData, UpdateGoalData, GoalPriority, GoalStatus } from '@/types/goal-types';
import { GOAL_PRIORITY_LABELS, GOAL_STATUS_LABELS } from '@/types/goal-types';

const GOAL_PRIORITIES: GoalPriority[] = ['low', 'medium', 'high'];

export default function GoalsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<GoalPriority | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<GoalStatus | 'all'>('active');
  const { goals, isLoading, createGoal, isCreatingGoal } = useGoals();

  const filteredGoals = goals.filter(goal => {
    const matchesStatus = selectedStatus === 'all' || goal.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || goal.priority === selectedPriority;
    return matchesStatus && matchesPriority;
  });

  const handleCreateGoal = async (data: CreateGoalData | UpdateGoalData) => {
    if ('id' in data) {
      const createData: CreateGoalData = {
        name: data.name!,
        target_amount: data.target_amount!,
        target_date: data.target_date!,
        priority: data.priority!,
        notes: data.notes,
      };
      await createGoal(createData);
    } else {
      await createGoal(data as CreateGoalData);
    }
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const totalTarget = activeGoals.reduce((sum, g) => sum + g.target_amount, 0);
  const totalSaved = activeGoals.reduce((sum, g) => sum + g.total_saved, 0);
  const totalRemaining = totalTarget - totalSaved;

  return (
    <DashboardLayout
      title="Goals"
      description="Set and track your financial goals"
      actions={
        <Button onClick={() => setFormOpen(true)}>
          <Plus size={18} />
          Add Goal
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/70 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{activeGoals.length}</p>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Target
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₹{totalTarget.toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-green-50 shadow-card dark:bg-green-950">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Saved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                ₹{totalSaved.toLocaleString('en-IN')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ₹{Math.max(0, totalRemaining).toLocaleString('en-IN')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'completed', 'paused'] as const).map(status => {
            const count =
              status === 'all' ? goals.length : goals.filter(g => g.status === status).length;
            return (
              <Badge
                key={status}
                variant={selectedStatus === status ? 'default' : 'outline'}
                className="cursor-pointer capitalize"
                onClick={() => setSelectedStatus(status)}
              >
                {status === 'all' ? 'All' : GOAL_STATUS_LABELS[status]} ({count})
              </Badge>
            );
          })}
        </div>

        {/* Priority Filters */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedPriority === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedPriority('all')}
          >
            All Goals ({goals.length})
          </Badge>
          {GOAL_PRIORITIES.map(priority => {
            const count = goals.filter(g => g.priority === priority).length;
            return (
              <Badge
                key={priority}
                variant={selectedPriority === priority ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedPriority(priority)}
              >
                {GOAL_PRIORITY_LABELS[priority]} ({count})
              </Badge>
            );
          })}
        </div>

        {/* Goals Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="h-64">
                <CardContent className="h-full animate-pulse bg-muted" />
              </Card>
            ))}
          </div>
        ) : filteredGoals.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="mb-2 h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                {selectedStatus !== 'all' || selectedPriority !== 'all'
                  ? 'No goals match your filters.'
                  : 'No goals yet. Start planning your financial future!'}
              </p>
              {selectedStatus === 'all' && selectedPriority === 'all' && (
                <Button onClick={() => setFormOpen(true)} className="mt-4" variant="default">
                  Create Your First Goal
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredGoals.map(goal => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </div>

      <GoalForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateGoal}
        isSubmitting={isCreatingGoal}
      />
    </DashboardLayout>
  );
}
