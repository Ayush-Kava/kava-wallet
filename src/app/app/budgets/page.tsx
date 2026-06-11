'use client';

import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import BudgetsPage from '@/components/organisms/modules/Budgets';

export default function Budgets() {
  return (
    <ProtectedRoute>
      <BudgetsPage />
    </ProtectedRoute>
  );
}
