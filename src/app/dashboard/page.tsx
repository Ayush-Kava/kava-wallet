'use client';

import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import DashboardPage from '@/components/organisms/modules/Dashboard';

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}
