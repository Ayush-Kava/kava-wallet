import CreditCardDetail from '@/components/organisms/modules/credit-cards/CreditCardDetail';
import { parsePublicId } from '@/lib/public-id';
import { notFound } from 'next/navigation';

type CreditCardDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CreditCardDetailPage({ params }: CreditCardDetailPageProps) {
  const { id: rawId } = await params;
  const id = parsePublicId(rawId);
  if (!id) notFound();

  return <CreditCardDetail cardId={id} />;
}
