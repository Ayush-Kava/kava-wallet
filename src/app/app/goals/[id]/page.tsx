import GoalDetail from '@/components/organisms/modules/goals/GoalDetail';
import { parsePublicId } from '@/lib/public-id';
import { notFound } from 'next/navigation';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = parsePublicId(rawId);
  if (!id) notFound();

  return <GoalDetail goalId={id} />;
}
