'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import DashboardPage from '@/page-components/Dashboard';

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}
