'use client';

import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import ComingSoon from '@/components/organisms/modules/ComingSoon';

export default function CreditCards() {
  return (
    <ProtectedRoute>
      <ComingSoon
        title="Credit Cards"
        description="Manage your cards, limits, rewards, and upcoming paymentsâ€”all in one place."
      />
    </ProtectedRoute>
  );
}
