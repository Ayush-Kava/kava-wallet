import { create } from 'zustand';

export interface TransactionFilters {
  search: string;
  accountId: string | null;
  categoryId: string | null;
  type: 'income' | 'expense' | null;
}

interface FilterState {
  transactionFilters: TransactionFilters;
  accountSearch: string;
  documentSearch: string;
  setTransactionSearch: (search: string) => void;
  setTransactionAccountId: (id: string | null) => void;
  setTransactionCategoryId: (id: string | null) => void;
  setTransactionType: (type: 'income' | 'expense' | null) => void;
  resetTransactionFilters: () => void;
  setAccountSearch: (search: string) => void;
  setDocumentSearch: (search: string) => void;
}

const defaultTransactionFilters: TransactionFilters = {
  search: '',
  accountId: null,
  categoryId: null,
  type: null,
};

export const useFilterStore = create<FilterState>(set => ({
  transactionFilters: defaultTransactionFilters,
  accountSearch: '',
  documentSearch: '',
  setTransactionSearch: search =>
    set(s => ({ transactionFilters: { ...s.transactionFilters, search } })),
  setTransactionAccountId: accountId =>
    set(s => ({
      transactionFilters: { ...s.transactionFilters, accountId },
    })),
  setTransactionCategoryId: categoryId =>
    set(s => ({
      transactionFilters: { ...s.transactionFilters, categoryId },
    })),
  setTransactionType: type => set(s => ({ transactionFilters: { ...s.transactionFilters, type } })),
  resetTransactionFilters: () => set({ transactionFilters: defaultTransactionFilters }),
  setAccountSearch: accountSearch => set({ accountSearch }),
  setDocumentSearch: documentSearch => set({ documentSearch }),
}));
