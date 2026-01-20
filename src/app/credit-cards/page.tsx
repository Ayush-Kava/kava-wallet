'use client';

import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import CreditCards from '@/components/organisms/modules/credit-cards/CreditCards';

export default function CreditCardsPage() {
  return (
    <ProtectedRoute>
      <CreditCards />
    </ProtectedRoute>
  );
}
