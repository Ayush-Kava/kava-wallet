'use client';

import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import InvestmentsPage from '@/components/organisms/modules/investments/InvestmentsPage';

export default function Investments() {
  return (
    <ProtectedRoute>
      <InvestmentsPage />
    </ProtectedRoute>
  );
}
