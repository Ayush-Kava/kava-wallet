'use client';

import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import ComingSoon from '@/components/organisms/modules/ComingSoon';

export default function Documents() {
  return (
    <ProtectedRoute>
      <ComingSoon
        title="Documents"
        description="Store receipts, statements, and proofs securely with quick search."
      />
    </ProtectedRoute>
  );
}
