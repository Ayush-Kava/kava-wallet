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
import { useState, useMemo } from 'react';
import type { LinkedEntityType } from '@/types/document-types';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useLoans } from '@/hooks/useLoans';
import { Loader2 } from 'lucide-react';

interface LinkDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLink: (entityType: LinkedEntityType, entityId: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function LinkDocumentDialog({
  open,
  onOpenChange,
  onLink,
  isSubmitting = false,
}: LinkDocumentDialogProps) {
  const [entityType, setEntityType] = useState<LinkedEntityType>('transaction');
  const [entityId, setEntityId] = useState('');

  // Fetch data for different entity types
  const { transactions, isLoading: transactionsLoading } = useTransactions(1, 100, undefined, {
    enableList: true,
  });
  const { accounts, isLoading: accountsLoading } = useAccounts();
  const { data: loans, isLoading: loansLoading } = useLoans().getLoans;

  // Create list of entities based on selected type
  const entities = useMemo(() => {
    switch (entityType) {
      case 'transaction':
        return transactions.map(t => ({
          id: t.id,
          label: `${t.description || 'Transaction'} - ${t.amount}`,
        }));
      case 'account':
        return (accounts || []).map(a => ({
          id: a.id,
          label: a.name,
        }));
      case 'loan':
      case 'emi':
        return (loans || []).map(l => ({
          id: l.id,
          label: l.name,
        }));
      case 'credit_card':
        // Credit cards would typically be part of accounts or a separate list
        // For now, return empty as we may not have a dedicated credit_card fetch
        return [];
      default:
        return [];
    }
  }, [entityType, transactions, accounts, loans]);

  const isLoading = transactionsLoading || accountsLoading || loansLoading;

  const handleSubmit = async () => {
    if (!entityId) return;
    await onLink(entityType, entityId);
    setEntityId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Link Document</DialogTitle>
          <DialogDescription>
            Link this document to a transaction, loan, card, or account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Link to</label>
            <Select
              value={entityType}
              onValueChange={value => {
                setEntityType(value as LinkedEntityType);
                setEntityId('');
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transaction">Transaction</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="loan">Loan</SelectItem>
                <SelectItem value="emi">EMI</SelectItem>
                <SelectItem value="account">Account</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Select {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
            </label>
            {isLoading && entityType !== 'credit_card' ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="mr-2 animate-spin" size={16} />
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            ) : (
              <Select value={entityId} onValueChange={setEntityId} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select a ${entityType}`} />
                </SelectTrigger>
                <SelectContent>
                  {entities.length > 0 ? (
                    entities.map(entity => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.label}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      No {entityType}s available
                    </div>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setEntityId('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !entityId}>
              {isSubmitting ? 'Linking...' : 'Link Document'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
