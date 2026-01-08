'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import TransactionsPage from '@/page-components/Transactions';

export default function Transactions() {
  return (
    <ProtectedRoute>
      <TransactionsPage />
    </ProtectedRoute>
  );
}
