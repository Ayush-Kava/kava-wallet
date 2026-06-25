import TransactionDetail from '@/components/organisms/modules/transactions/TransactionDetail';

type TransactionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TransactionDetailPage({ params }: TransactionPageProps) {
  const { id } = await params;

  return <TransactionDetail transactionId={id} />;
}
