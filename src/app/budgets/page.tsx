'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import BudgetsPage from '@/page-components/Budgets';

export default function Budgets() {
  return (
    <ProtectedRoute>
      <BudgetsPage />
    </ProtectedRoute>
  );
}
