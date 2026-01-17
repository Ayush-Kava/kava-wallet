import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import ComingSoon from '@/components/organisms/modules/ComingSoon';

type TransactionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TransactionDetail({
  params,
}: TransactionPageProps) {
  const { id } = await params;

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Transaction Details"
        description={`Detailed view for transaction ${id} is coming soon.`}
      >
        <ComingSoon
          title="Transaction Details"
          description={`Detailed view for transaction ${id} is coming soon.`}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
