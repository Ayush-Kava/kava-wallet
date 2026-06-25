import type { Account, AccountType } from '@/types/account-types';

export const NON_NEGATIVE_ACCOUNT_TYPES = new Set<AccountType>(['cash', 'bank', 'wallet']);

export const INSUFFICIENT_BALANCE_TITLE = 'Insufficient balance';

type ToastFn = (options: {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  dataIntent?: 'success' | 'error' | 'info' | 'warning';
}) => void;

export const formatInsufficientBalanceDescription = (
  available: number,
  required: number,
): string => `Available: ₹${available.toFixed(2)}, required: ₹${required.toFixed(2)}.`;

export const formatInsufficientBalanceMessage = (
  available: number,
  required: number,
): string => `${INSUFFICIENT_BALANCE_TITLE}. ${formatInsufficientBalanceDescription(available, required)}`;

export class InsufficientBalanceError extends Error {
  constructor(available: number, required: number) {
    super(formatInsufficientBalanceMessage(available, required));
    this.name = 'InsufficientBalanceError';
  }
}

export function getInsufficientBalanceDetails(
  accountId: string,
  amount: number,
  accounts: Account[],
): { available: number; required: number } | null {
  const account = accounts.find(acc => acc.id === accountId);
  if (!account || !NON_NEGATIVE_ACCOUNT_TYPES.has(account.type)) return null;
  if (amount > account.balance) {
    return { available: account.balance, required: amount };
  }
  return null;
}

export function isInsufficientBalanceMessage(message: string): boolean {
  return message.startsWith(INSUFFICIENT_BALANCE_TITLE);
}

export function showInsufficientBalanceToast(
  toast: ToastFn,
  available: number,
  required: number,
): void {
  toast({
    title: INSUFFICIENT_BALANCE_TITLE,
    description: formatInsufficientBalanceDescription(available, required),
    variant: 'default',
    dataIntent: 'warning',
  });
}

export function showInsufficientBalanceToastFromMessage(
  toast: ToastFn,
  message: string,
): void {
  toast({
    title: INSUFFICIENT_BALANCE_TITLE,
    description: message.replace(/^Insufficient balance\.\s*/, ''),
    variant: 'default',
    dataIntent: 'warning',
  });
}
