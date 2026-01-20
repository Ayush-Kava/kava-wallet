import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import GoalDetail from '@/components/organisms/modules/goals/GoalDetail';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ProtectedRoute>
      <GoalDetail goalId={id} />
    </ProtectedRoute>
  );
}
