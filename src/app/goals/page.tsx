import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import GoalsPage from '@/components/organisms/modules/goals/GoalsPage';

export default function Page() {
  return (
    <ProtectedRoute>
      <GoalsPage />
    </ProtectedRoute>
  );
}
