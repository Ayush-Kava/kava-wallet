import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import ComingSoon from '@/components/organisms/modules/ComingSoon';

type AccountPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AccountDetail({ params }: AccountPageProps) {
  const { id } = await params;

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Account Details"
        description={`Detailed view for account ${id} is coming soon.`}
      >
        <ComingSoon
          title="Account Details"
          description={`Detailed view for account ${id} is coming soon.`}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
