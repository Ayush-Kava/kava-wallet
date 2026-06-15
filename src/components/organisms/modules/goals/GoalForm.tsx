'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/molecules/common/DatePicker';
import type {
  CreateGoalData,
  UpdateGoalData,
  GoalPriority,
  GoalStatus,
  GoalWithFunding,
} from '@/types/goal-types';
import { GOAL_PRIORITY_LABELS, GOAL_STATUS_LABELS } from '@/types/goal-types';
import { Loader2 } from 'lucide-react';

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateGoalData | UpdateGoalData) => Promise<void>;
  isSubmitting?: boolean;
  initialData?: GoalWithFunding;
  mode?: 'create' | 'edit';
}

const GOAL_PRIORITIES: GoalPriority[] = ['low', 'medium', 'high'];
const GOAL_STATUSES: GoalStatus[] = ['active', 'completed', 'paused'];

function createGoalFormData(initialData?: GoalWithFunding): CreateGoalData {
  if (!initialData) {
    return {
      name: '',
      target_amount: 0,
      target_date: new Date().toISOString().split('T')[0],
      priority: 'medium',
      status: 'active',
      notes: '',
    };
  }

  return {
    name: initialData.name,
    target_amount: initialData.target_amount,
    target_date: initialData.target_date.split('T')[0],
    priority: initialData.priority,
    status: initialData.status,
    notes: initialData.notes || '',
  };
}

interface GoalFormFieldsProps {
  initialData?: GoalWithFunding;
  mode: 'create' | 'edit';
  onSubmit: (data: CreateGoalData | UpdateGoalData) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
}

function GoalFormFields({
  initialData,
  mode,
  onSubmit,
  onOpenChange,
  isSubmitting,
}: GoalFormFieldsProps) {
  const [formData, setFormData] = useState<CreateGoalData>(() => createGoalFormData(initialData));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label>Goal Name *</Label>
        <Input
          type="text"
          placeholder="e.g., Emergency Fund, New Car, House Down Payment"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Target Amount *</Label>
          <Input
            type="number"
            placeholder="0.00"
            step="0.01"
            min="0"
            value={formData.target_amount || ''}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                target_amount: parseFloat(e.target.value) || 0,
              }))
            }
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Target Date *</Label>
          <DatePicker
            value={formData.target_date}
            onChange={target_date => setFormData(prev => ({ ...prev, target_date }))}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Priority *</Label>
          <Select
            value={formData.priority}
            onValueChange={value =>
              setFormData(prev => ({
                ...prev,
                priority: value as GoalPriority,
              }))
            }
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOAL_PRIORITIES.map(priority => (
                <SelectItem key={priority} value={priority}>
                  {GOAL_PRIORITY_LABELS[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status *</Label>
          <Select
            value={formData.status || 'active'}
            onValueChange={value =>
              setFormData(prev => ({
                ...prev,
                status: value as GoalStatus,
              }))
            }
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOAL_STATUSES.map(status => (
                <SelectItem key={status} value={status}>
                  {GOAL_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          placeholder="Add any notes about this goal"
          value={formData.notes || ''}
          onChange={e =>
            setFormData(prev => ({
              ...prev,
              notes: e.target.value,
            }))
          }
          disabled={isSubmitting}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === 'create' ? 'Creating...' : 'Updating...'}
            </>
          ) : mode === 'create' ? (
            'Create Goal'
          ) : (
            'Update Goal'
          )}
        </Button>
      </div>
    </form>
  );
}

export function GoalForm({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
  mode = 'create',
}: GoalFormProps) {
  const [formSession, setFormSession] = useState(0);

  const handleOpenChange = (next: boolean) => {
    if (next) setFormSession(session => session + 1);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Goal' : 'Edit Goal'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Set a financial target and track your progress'
              : 'Update your goal details'}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <GoalFormFields
            key={`${mode}-${initialData?.id ?? 'new'}-${formSession}`}
            initialData={initialData}
            mode={mode}
            onSubmit={onSubmit}
            onOpenChange={onOpenChange}
            isSubmitting={isSubmitting}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
