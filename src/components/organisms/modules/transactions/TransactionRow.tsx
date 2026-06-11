import type { Transaction } from '@/types/transaction-types';

interface TransactionRowProps {
  transaction: Transaction;
}

const formatAmount = (amount: number, type: 'income' | 'expense') => {
  const formatted = Math.abs(amount).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });

  return `${type === 'income' ? '+' : '-'} ${formatted}`;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function TransactionRow({ transaction }: TransactionRowProps) {
  const amountClasses = transaction.type === 'income' ? 'text-success' : 'text-destructive';

  const accountName = transaction.accounts?.name || 'Unknown Account';
  const categoryName = transaction.categories?.name || 'Uncategorized';

  return (
    <tr className="cursor-pointer border-b border-border transition-colors hover:bg-muted">
      <td className="whitespace-nowrap p-4">{formatDate(transaction.date)}</td>
      <td className="p-4">
        <div className="font-medium text-foreground">
          {transaction.description || 'No description'}
        </div>
        <div className="text-xs text-muted-foreground">{categoryName}</div>
      </td>
      <td className="p-4 text-foreground">{accountName}</td>
      <td className={`p-4 text-right font-medium ${amountClasses}`}>
        {formatAmount(transaction.amount, transaction.type)}
      </td>
    </tr>
  );
}
