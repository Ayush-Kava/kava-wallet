'use client';

import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import AccountsPage from '@/components/organisms/modules/Accounts';

export default function Accounts() {
  return (
    <ProtectedRoute>
      <AccountsPage />
    </ProtectedRoute>
  );
}
