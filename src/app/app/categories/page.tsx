'use client';

import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import CategoriesPage from '@/components/organisms/modules/categories/CategoriesPage';

export default function Categories() {
  return (
    <ProtectedRoute>
      <CategoriesPage />
    </ProtectedRoute>
  );
}
