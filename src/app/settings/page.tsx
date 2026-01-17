'use client';

import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import SettingsPage from '@/components/organisms/modules/Settings';

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  );
}
