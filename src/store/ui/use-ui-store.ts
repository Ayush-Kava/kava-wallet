import { create } from 'zustand';
import { parseTransactionDialogDefaults } from '@/lib/transaction-dialog-utils';
import type { TransactionDialogDefaults } from '@/types/transaction-dialog-types';

interface UiState {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  transactionDialogOpen: boolean;
  transactionDialogDefaults: TransactionDialogDefaults;
  transactionDialogSession: number;
  setSidebarOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  openTransactionDialog: (defaults?: TransactionDialogDefaults) => void;
  closeTransactionDialog: () => void;
  setTransactionDialogOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>(set => ({
  sidebarOpen: true,
  mobileMenuOpen: false,
  transactionDialogOpen: false,
  transactionDialogDefaults: {},
  transactionDialogSession: 0,
  setSidebarOpen: open => set({ sidebarOpen: open }),
  setMobileMenuOpen: open => set({ mobileMenuOpen: open }),
  toggleMobileMenu: () => set(s => ({ mobileMenuOpen: !s.mobileMenuOpen })),
  openTransactionDialog: defaults =>
    set(state => ({
      transactionDialogOpen: true,
      transactionDialogDefaults: parseTransactionDialogDefaults(defaults ?? {}),
      transactionDialogSession: state.transactionDialogSession + 1,
    })),
  closeTransactionDialog: () =>
    set({
      transactionDialogOpen: false,
      transactionDialogDefaults: {},
    }),
  setTransactionDialogOpen: open => {
    if (!open) {
      set({ transactionDialogOpen: false, transactionDialogDefaults: {} });
    } else {
      set({ transactionDialogOpen: true });
    }
  },
}));
