import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import AccountLedger from '@/components/organisms/modules/account/AccountLedger';

type AccountDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AccountDetailPage({
  params,
}: AccountDetailPageProps) {
  const { id } = await params;

  return (
    <ProtectedRoute>
      <AccountLedger accountId={id} />
    </ProtectedRoute>
  );
}
