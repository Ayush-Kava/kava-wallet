'use client';

import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import LoansPage from '@/components/organisms/modules/loans/LoansPage';

export default function Loans() {
  return (
    <ProtectedRoute>
      <LoansPage />
    </ProtectedRoute>
  );
}
