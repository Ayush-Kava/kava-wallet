import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import InvestmentDetail from '@/components/organisms/modules/investments/InvestmentDetail';

type InvestmentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function InvestmentDetailPage({
  params,
}: InvestmentDetailPageProps) {
  const { id } = await params;

  return (
    <ProtectedRoute>
      <InvestmentDetail investmentId={id} />
    </ProtectedRoute>
  );
}
