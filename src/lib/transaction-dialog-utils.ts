import type { Account } from '@/types/account-types';
import type { Category } from '@/types/category-types';
import {
  transactionDialogDefaultsSchema,
  type TransactionDialogDefaults,
} from '@/types/transaction-dialog-types';

const accountIds = (accounts: Account[]) => new Set(accounts.map(a => a.id));

const categoryIds = (categories: Category[]) => new Set(categories.map(c => c.id));

/** Parse untrusted input (e.g. URL params) — drops invalid UUIDs and unknown keys. */
export const parseTransactionDialogDefaults = (input: unknown): TransactionDialogDefaults => {
  const result = transactionDialogDefaultsSchema.safeParse(input);
  return result.success ? result.data : {};
};

/**
 * Restrict defaults to IDs the user owns. Server enforces ownership on submit;
 * this prevents prefilling another user's resource IDs from URL manipulation.
 */
export const sanitizeTransactionDialogDefaults = (
  defaults: TransactionDialogDefaults,
  accounts: Account[],
  incomeCategories: Category[],
  expenseCategories: Category[],
): TransactionDialogDefaults => {
  const parsed = parseTransactionDialogDefaults(defaults);
  if (accounts.length === 0) {
    return {
      mode: parsed.mode,
      preserveAccountOnSave: parsed.preserveAccountOnSave,
    };
  }

  const ownedAccounts = accountIds(accounts);
  const mode = parsed.mode ?? 'expense';
  const categories = mode === 'income' ? incomeCategories : expenseCategories;
  const ownedCategories = categoryIds(categories);

  const sanitized: TransactionDialogDefaults = {
    mode: parsed.mode,
    preserveAccountOnSave: parsed.preserveAccountOnSave,
  };

  if (parsed.accountId && ownedAccounts.has(parsed.accountId)) {
    sanitized.accountId = parsed.accountId;
  }
  if (parsed.fromAccountId && ownedAccounts.has(parsed.fromAccountId)) {
    sanitized.fromAccountId = parsed.fromAccountId;
  }
  if (parsed.toAccountId && ownedAccounts.has(parsed.toAccountId)) {
    sanitized.toAccountId = parsed.toAccountId;
  }
  if (parsed.categoryId && ownedCategories.has(parsed.categoryId)) {
    sanitized.categoryId = parsed.categoryId;
  }

  return sanitized;
};
