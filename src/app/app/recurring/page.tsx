'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { RecurringRulesTable } from '@/components/organisms/modules/recurring/RecurringRulesTable';
import { RecurringForm } from '@/components/organisms/modules/recurring/RecurringForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { useRecurringRules } from '@/hooks/useRecurringRules';
import type { RecurringRule } from '@/types/recurring-types';
import { Loader2, Plus, RotateCw } from 'lucide-react';

function RecurringPageInner() {
  const {
    recurringRules,
    isLoading,
    createRule,
    updateRule,
    deleteRule,
    togglePause,
    processDue,
    runRuleNow,
  } = useRecurringRules();

  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateClick = () => {
    setEditingRule(null);
    setFormOpen(true);
  };

  const handleSubmit = async (payload: Parameters<typeof createRule.mutateAsync>[0]) => {
    if (!payload) return;
    setIsSubmitting(true);
    try {
      if (editingRule) {
        await updateRule.mutateAsync({ id: editingRule.id, ...payload });
      } else {
        await createRule.mutateAsync(payload);
      }
      setFormOpen(false);
      setEditingRule(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteRule.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const actions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={() => processDue.mutate()}
        disabled={processDue.isPending}
        className="inline-flex items-center gap-2"
      >
        {processDue.isPending ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <RotateCw size={16} />
        )}
        Process due
      </Button>
      <Button onClick={handleCreateClick} className="inline-flex items-center gap-2">
        <Plus size={16} /> New rule
      </Button>
    </div>
  );

  return (
    <DashboardLayout
      title="Recurring"
      description="Automate transactions with recurring rules"
      actions={actions}
    >
      <div className="space-y-6">
        <Card className="border-border/70 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="font-display">Your recurring rules</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={handleCreateClick}>
              Add rule
            </Button>
          </CardHeader>
          <CardContent>
            <RecurringRulesTable
              rules={recurringRules}
              isLoading={isLoading}
              onEdit={rule => {
                setEditingRule(rule);
                setFormOpen(true);
              }}
              onDelete={ruleId => setDeleteId(ruleId)}
              onTogglePause={rule => togglePause.mutate({ id: rule.id, paused: !rule.paused })}
              onRunNow={rule => runRuleNow.mutate(rule.id)}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={formOpen}
        onOpenChange={next => {
          setFormOpen(next);
          if (!next) setEditingRule(null);
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingRule ? 'Edit recurring rule' : 'New recurring rule'}
            </DialogTitle>
          </DialogHeader>
          <RecurringForm
            initialRule={editingRule}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting || createRule.isPending || updateRule.isPending}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteId)} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete recurring rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone and will remove the rule permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
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

export default function RecurringPage() {
  return <RecurringPageInner />;
}
