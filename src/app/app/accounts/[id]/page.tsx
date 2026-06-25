import AccountLedger from '@/components/organisms/modules/account/AccountLedger';
import { parsePublicId } from '@/lib/public-id';
import { notFound } from 'next/navigation';

type AccountDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AccountDetailPage({ params }: AccountDetailPageProps) {
  const { id: rawId } = await params;
  const id = parsePublicId(rawId);
  if (!id) notFound();

  return <AccountLedger accountId={id} />;
}
