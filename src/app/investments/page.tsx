'use client';

import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import ComingSoon from '@/components/organisms/modules/ComingSoon';

export default function Investments() {
  return (
    <ProtectedRoute>
      <ComingSoon
        title="Investments"
        description="Monitor holdings, SIPs, and performance insights across all assets."
      />
    </ProtectedRoute>
  );
}
