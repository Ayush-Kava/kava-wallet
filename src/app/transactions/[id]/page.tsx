import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import TransactionDetail from '@/components/organisms/modules/transactions/TransactionDetail';

type TransactionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TransactionDetailPage({
  params,
}: TransactionPageProps) {
  const { id } = await params;

  return (
    <ProtectedRoute>
      <TransactionDetail transactionId={id} />
    </ProtectedRoute>
  );
}
