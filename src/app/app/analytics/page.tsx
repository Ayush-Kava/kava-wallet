'use client';

import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import AnalyticsPage from '@/components/organisms/modules/Analytics';

export default function Analytics() {
  return (
    <ProtectedRoute>
      <AnalyticsPage />
    </ProtectedRoute>
  );
}
