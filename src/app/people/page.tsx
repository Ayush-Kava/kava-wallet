'use client';

import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import ComingSoon from '@/components/organisms/modules/ComingSoon';

export default function People() {
  return (
    <ProtectedRoute>
      <ComingSoon
        title="People"
        description="Share access, manage dependents, and collaborate on finances."
      />
    </ProtectedRoute>
  );
}
