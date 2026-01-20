import { supabase } from '@/integrations/supabase/client';
import type {
  CreateTransactionData,
  Transaction,
  TransactionDetail,
  TransactionFilters,
  PaginatedTransactionsResult,
  CreateTransferData,
  UpdateTransferData,
} from '@/types/transaction-types';

export const transactionsApi = {
  getTransactions: async (
    userId: string,
    page: number,
    limit: number,
    filters?: TransactionFilters,
  ): Promise<PaginatedTransactionsResult> => {
    let query = supabase
      .from('transactions')
      .select(
        `
        *,
        accounts(name, type),
        categories(name, icon, color)
      `,
        { count: 'exact' },
      )
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (filters?.type && filters.type !== 'Income & Expense') {
      query = query.eq(
        'type',
        filters.type.toLowerCase() as 'income' | 'expense',
      );
    }

    const { data: allData, error } = await query;
    if (error) throw error;

    let filteredData = allData as Transaction[];

    if (filters?.account && filters.account !== 'All Accounts') {
      filteredData = filteredData.filter((transaction) =>
        transaction.accounts?.name
          ?.toLowerCase()
          .includes(filters.account!.toLowerCase()),
      );
    }

    if (filters?.category && filters.category !== 'All Categories') {
      filteredData = filteredData.filter((transaction) =>
        transaction.categories?.name
          ?.toLowerCase()
          .includes(filters.category!.toLowerCase()),
      );
    }

    const totalCount = filteredData.length;
    const from = (page - 1) * limit;
    const to = from + limit;
    const paginatedData = filteredData.slice(from, to);

    return {
      data: paginatedData,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    };
  },

  createTransaction: async (
    userId: string,
    data: CreateTransactionData,
  ): Promise<void> => {
    const { error } = await supabase.from('transactions').insert({
      ...data,
      user_id: userId,
    });
    if (error) throw error;
  },

  createTransfer: async (
    userId: string,
    data: CreateTransferData,
  ): Promise<void> => {
    if (data.from_account_id === data.to_account_id) {
      throw new Error('From and To accounts must be different.');
    }

    const transferId = crypto.randomUUID();
    const description = data.description || 'Account transfer';

    const entries = [
      {
        account_id: data.from_account_id,
        category_id: null,
        type: 'expense' as const,
        amount: data.amount,
        description,
        date: data.date,
        transfer_id: transferId,
        user_id: userId,
      },
      {
        account_id: data.to_account_id,
        category_id: null,
        type: 'income' as const,
        amount: data.amount,
        description,
        date: data.date,
        transfer_id: transferId,
        user_id: userId,
      },
    ];

    const { error } = await supabase.from('transactions').insert(entries);
    if (error) throw error;
  },

  updateTransaction: async (
    userId: string,
    { id, ...data }: Partial<CreateTransactionData> & { id: string },
  ): Promise<void> => {
    const { error } = await supabase
      .from('transactions')
      .update(data)
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },

  updateTransfer: async (
    userId: string,
    data: UpdateTransferData,
  ): Promise<void> => {
    const { data: entries, error } = await supabase
      .from('transactions')
      .select('id, type')
      .eq('transfer_id', data.transfer_id)
      .eq('user_id', userId);

    if (error) throw error;
    if (!entries || entries.length === 0) {
      throw new Error('Transfer not found');
    }

    const incomeEntry = entries.find((entry) => entry.type === 'income');
    const expenseEntry = entries.find((entry) => entry.type === 'expense');

    if (!incomeEntry || !expenseEntry) {
      throw new Error('Incomplete transfer entries');
    }

    const description = data.description || 'Account transfer';

    const [expenseUpdate, incomeUpdate] = await Promise.all([
      supabase
        .from('transactions')
        .update({
          account_id: data.from_account_id,
          category_id: null,
          amount: data.amount,
          description,
          date: data.date,
        })
        .eq('id', expenseEntry.id)
        .eq('user_id', userId),
      supabase
        .from('transactions')
        .update({
          account_id: data.to_account_id,
          category_id: null,
          amount: data.amount,
          description,
          date: data.date,
        })
        .eq('id', incomeEntry.id)
        .eq('user_id', userId),
    ]);

    if (expenseUpdate.error) throw expenseUpdate.error;
    if (incomeUpdate.error) throw incomeUpdate.error;
  },

  deleteTransaction: async (
    userId: string,
    id: string,
  ): Promise<{ deletedTransfer: boolean }> => {
    const { data: existing, error: fetchError } = await (
      supabase.from('transactions') as any
    )
      .select('id, transfer_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      if (String(fetchError.message).includes('transfer_id')) {
        return { deletedTransfer: false };
      }
      throw fetchError;
    }

    if (!existing) throw new Error('Transaction not found');

    if (existing.transfer_id) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('transfer_id', existing.transfer_id)
        .eq('user_id', userId);

      if (error) throw error;
      return { deletedTransfer: true };
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
    return { deletedTransfer: false };
  },

  duplicateTransaction: async (
    userId: string,
    id: string,
  ): Promise<{ duplicatedTransfer: boolean }> => {
    const { data: base, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!base) throw new Error('Transaction not found');

    const baseTx = base as Transaction;

    if (baseTx.transfer_id) {
      const { data: transferEntries, error: transferError } = await supabase
        .from('transactions')
        .select('*')
        .eq('transfer_id', baseTx.transfer_id)
        .eq('user_id', userId);

      if (transferError) throw transferError;
      if (!transferEntries || transferEntries.length < 2) {
        throw new Error('Linked transfer entries missing');
      }

      const newTransferId = crypto.randomUUID();
      const description = baseTx.description || 'Account transfer';

      const newEntries = transferEntries.map((entry) => ({
        account_id: entry.account_id,
        category_id: null,
        type: entry.type,
        amount: entry.amount,
        description,
        date: entry.date,
        transfer_id: newTransferId,
        user_id: userId,
      }));

      const { error: insertError } = await supabase
        .from('transactions')
        .insert(newEntries);

      if (insertError) throw insertError;
      return { duplicatedTransfer: true };
    }

    const { error: duplicateError } = await supabase
      .from('transactions')
      .insert({
        account_id: base.account_id,
        category_id: baseTx.category_id,
        type: baseTx.type,
        amount: baseTx.amount,
        description: baseTx.description,
        date: baseTx.date,
        user_id: userId,
      });

    if (duplicateError) throw duplicateError;
    return { duplicatedTransfer: false };
  },

  getTransactionDetail: async (
    userId: string,
    id: string,
  ): Promise<TransactionDetail> => {
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select(
        `
        *,
        accounts(name, type),
        categories(name, icon, color)
      `,
      )
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!transaction) throw new Error('Transaction not found');

    let linkedTransactions: Transaction[] = [];

    const transferId = (transaction as Transaction).transfer_id;

    if (transferId) {
      const { data: linked, error: linkedError } = await supabase
        .from('transactions')
        .select(
          `
          *,
          accounts(name, type),
          categories(name, icon, color)
        `,
        )
        .eq('transfer_id', transferId as string)
        .eq('user_id', userId);

      if (linkedError) throw linkedError;

      linkedTransactions = (linked as Transaction[]).filter(
        (tx) => tx.id !== (transaction as Transaction).id,
      );
    }

    return {
      transaction: transaction as Transaction,
      linkedTransactions,
    };
  },
};
