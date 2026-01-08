'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import AccountsPage from '@/page-components/Accounts';

export default function Accounts() {
  return (
    <ProtectedRoute>
      <AccountsPage />
    </ProtectedRoute>
  );
}
