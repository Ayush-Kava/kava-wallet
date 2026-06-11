'use client';

import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import TransactionsPage from '@/components/organisms/modules/transactions/TransactionsPage';

export default function Transactions() {
  return (
    <ProtectedRoute>
      <TransactionsPage />
    </ProtectedRoute>
  );
}
