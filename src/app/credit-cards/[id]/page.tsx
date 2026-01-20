import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import CreditCardDetail from '@/components/organisms/modules/credit-cards/CreditCardDetail';

type CreditCardDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CreditCardDetailPage({
  params,
}: CreditCardDetailPageProps) {
  const { id } = await params;

  return (
    <ProtectedRoute>
      <CreditCardDetail cardId={id} />
    </ProtectedRoute>
  );
}
