'use client';

import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import AccountsPage from '@/components/organisms/modules/accounts/AccountsPage';

export default function Accounts() {
  return (
    <ProtectedRoute>
      <AccountsPage />
    </ProtectedRoute>
  );
}
