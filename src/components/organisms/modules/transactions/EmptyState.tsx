'use client';

import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/ui/use-ui-store';
import { Plus } from 'lucide-react';

export default function EmptyState() {
  const { openTransactionDialog } = useUiStore();

  return (
    <div className="py-16 text-center text-muted-foreground">
      <p>No transactions found</p>
      <Button className="mt-4" size="sm" onClick={() => openTransactionDialog({ mode: 'expense' })}>
        <Plus className="mr-2 h-4 w-4" />
        Add your first transaction
      </Button>
    </div>
  );
}
