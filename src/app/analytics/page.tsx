'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import AnalyticsPage from '@/page-components/Analytics';

export default function Analytics() {
  return (
    <ProtectedRoute>
      <AnalyticsPage />
    </ProtectedRoute>
  );
}
