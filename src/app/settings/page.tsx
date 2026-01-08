'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import SettingsPage from '@/page-components/Settings';

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  );
}
