import InvestmentDetail from '@/components/organisms/modules/investments/InvestmentDetail';
import { parsePublicId } from '@/lib/public-id';
import { notFound } from 'next/navigation';

type InvestmentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function InvestmentDetailPage({ params }: InvestmentDetailPageProps) {
  const { id: rawId } = await params;
  const id = parsePublicId(rawId);
  if (!id) notFound();

  return <InvestmentDetail investmentId={id} />;
}
