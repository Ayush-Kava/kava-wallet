'use client';

import { TransactionFormDialog } from './TransactionFormDialog';
import { useUiStore } from '@/store/ui/use-ui-store';

export function GlobalTransactionDialog() {
  const {
    transactionDialogOpen,
    transactionDialogDefaults,
    transactionDialogSession,
    closeTransactionDialog,
    setTransactionDialogOpen,
  } = useUiStore();

  return (
    <TransactionFormDialog
      open={transactionDialogOpen}
      formKey={transactionDialogSession}
      onOpenChange={open => {
        if (open) setTransactionDialogOpen(true);
        else closeTransactionDialog();
      }}
      defaults={transactionDialogDefaults}
    />
  );
}
