'use client';

import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import ComingSoon from '@/components/organisms/modules/ComingSoon';

export default function Loans() {
  return (
    <ProtectedRoute>
      <ComingSoon
        title="Loans & EMIs"
        description="Track disbursements, EMIs, and payoff plans with timely reminders."
      />
    </ProtectedRoute>
  );
}
