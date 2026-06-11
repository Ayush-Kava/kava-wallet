'use client';

import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import { GlobalTransactionDialog } from '@/components/organisms/modules/transactions/GlobalTransactionDialog';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      {children}
      <GlobalTransactionDialog />
    </ProtectedRoute>
  );
}
