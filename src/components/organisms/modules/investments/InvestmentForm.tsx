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
import { useAccounts } from '@/hooks/useAccounts';
import type {
  CreateInvestmentData,
  UpdateInvestmentData,
  Investment,
  InvestmentType,
} from '@/types/investment-types';
import { INVESTMENT_TYPE_LABELS } from '@/types/investment-types';
import { Loader2 } from 'lucide-react';

interface InvestmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateInvestmentData | UpdateInvestmentData) => Promise<void>;
  isSubmitting?: boolean;
  initialData?: Investment;
  mode?: 'create' | 'edit';
}

const INVESTMENT_TYPES: InvestmentType[] = ['mutual_fund', 'stock', 'fd', 'gold', 'crypto'];

function createInvestmentFormData(initialData?: Investment): CreateInvestmentData {
  if (!initialData) {
    return {
      name: '',
      type: 'mutual_fund',
      invested_amount: 0,
      current_value: 0,
      account_id: '',
      start_date: new Date().toISOString().split('T')[0],
      notes: '',
    };
  }

  return {
    name: initialData.name,
    type: initialData.type,
    invested_amount: initialData.invested_amount,
    current_value: initialData.current_value,
    account_id: initialData.account_id,
    start_date: initialData.start_date.split('T')[0],
    notes: initialData.notes || '',
  };
}

interface InvestmentFormFieldsProps {
  initialData?: Investment;
  mode: 'create' | 'edit';
  onSubmit: (data: CreateInvestmentData | UpdateInvestmentData) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
}

function InvestmentFormFields({
  initialData,
  mode,
  onSubmit,
  onOpenChange,
  isSubmitting,
}: InvestmentFormFieldsProps) {
  const { accounts } = useAccounts();
  const [formData, setFormData] = useState<CreateInvestmentData>(() =>
    createInvestmentFormData(initialData),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label>Investment Name *</Label>
        <Input
          type="text"
          placeholder="e.g., SBI Sensex Fund"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Type *</Label>
          <Select
            value={formData.type}
            onValueChange={value =>
              setFormData(prev => ({
                ...prev,
                type: value as InvestmentType,
              }))
            }
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVESTMENT_TYPES.map(type => (
                <SelectItem key={type} value={type}>
                  {INVESTMENT_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Account *</Label>
          <Select
            value={formData.account_id}
            onValueChange={value =>
              setFormData(prev => ({
                ...prev,
                account_id: value,
              }))
            }
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts?.map(account => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Invested Amount *</Label>
          <Input
            type="number"
            placeholder="0.00"
            step="0.01"
            min="0"
            value={formData.invested_amount || ''}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                invested_amount: parseFloat(e.target.value) || 0,
              }))
            }
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Current Value *</Label>
          <Input
            type="number"
            placeholder="0.00"
            step="0.01"
            min="0"
            value={formData.current_value || ''}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                current_value: parseFloat(e.target.value) || 0,
              }))
            }
            disabled={isSubmitting}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Start Date *</Label>
        <DatePicker
          value={formData.start_date}
          onChange={start_date => setFormData(prev => ({ ...prev, start_date }))}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          placeholder="Add any notes about this investment"
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
              {mode === 'create' ? 'Adding...' : 'Updating...'}
            </>
          ) : mode === 'create' ? (
            'Add Investment'
          ) : (
            'Update Investment'
          )}
        </Button>
      </div>
    </form>
  );
}

export function InvestmentForm({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
  mode = 'create',
}: InvestmentFormProps) {
  const [formSession, setFormSession] = useState(0);

  const handleOpenChange = (next: boolean) => {
    if (next) setFormSession(session => session + 1);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add New Investment' : 'Edit Investment'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Track your investments and monitor returns'
              : 'Update your investment details'}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <InvestmentFormFields
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
