import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { GoalWithFunding } from '@/types/goal-types';
import { GOAL_PRIORITY_LABELS, GOAL_PRIORITY_COLORS } from '@/types/goal-types';
import { Calendar } from 'lucide-react';
import { formatDateStr } from '@/lib/ledger-utils';

interface GoalCardProps {
  goal: GoalWithFunding;
}

export function GoalCard({ goal }: GoalCardProps) {
  const isOverdue =
    new Date(goal.target_date) < new Date() && goal.status === 'active';
  const daysRemaining = Math.ceil(
    (new Date(goal.target_date).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <Link href={`/goals/${goal.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-1">
                {goal.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Calendar size={14} />
                <span>{formatDateStr(goal.target_date)}</span>
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs">
                    Overdue
                  </Badge>
                )}
              </div>
            </div>
            <Badge className={GOAL_PRIORITY_COLORS[goal.priority]}>
              {GOAL_PRIORITY_LABELS[goal.priority]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Target</p>
              <p className="text-sm font-semibold">
                ₹{goal.target_amount.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saved</p>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                ₹{goal.total_saved.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">
                {goal.progress_percentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={goal.progress_percentage} className="h-2" />
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t">
            <span className="text-muted-foreground">Remaining</span>
            <span className="font-semibold">
              ₹{Math.max(0, goal.remaining).toLocaleString('en-IN')}
            </span>
          </div>

          {!isOverdue && daysRemaining > 0 && (
            <div className="text-xs text-muted-foreground text-center pt-1">
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
