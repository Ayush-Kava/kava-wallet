'use client';

import { Suspense, useRef } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { ROUTES } from '@/lib/constants/routes';

import { parseTransactionDialogDefaults } from '@/lib/transaction-dialog-utils';

import { useUiStore } from '@/store/ui/use-ui-store';

function TransactionNewRedirect() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const openTransactionDialog = useUiStore(state => state.openTransactionDialog);

  const openedRef = useRef(false);

  if (!openedRef.current) {
    openedRef.current = true;

    const type = searchParams.get('type');

    const mode = type === 'transfer' || type === 'income' || type === 'expense' ? type : undefined;

    const defaults = parseTransactionDialogDefaults({
      mode,

      accountId: searchParams.get('account') ?? undefined,

      fromAccountId: searchParams.get('from') ?? undefined,

      toAccountId: searchParams.get('to') ?? undefined,

      categoryId: searchParams.get('category') ?? undefined,

      preserveAccountOnSave: Boolean(searchParams.get('account') || searchParams.get('from')),
    });

    queueMicrotask(() => {
      openTransactionDialog(defaults);

      router.replace(ROUTES.transactions);
    });
  }

  return <div className="p-6 text-sm text-muted-foreground">Opening transaction form…</div>;
}

export default function NewTransactionPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <TransactionNewRedirect />
    </Suspense>
  );
}
