'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useAccounts, useAccountForEdit } from '@/hooks/useAccounts';
import type { Account, CreateAccountData } from '@/types/account-types';
import { Plus, Loader2 } from 'lucide-react';
import { AccountsSummary } from './AccountsSummary';
import { AccountsGrid } from './AccountsGrid';
import { AccountFormDialog } from './AccountFormDialog';
import { DeleteAccountDialog } from './DeleteAccountDialog';

export default function AccountsPage() {
  const router = useRouter();
  const {
    accounts,
    isLoading,
    totalBalance,
    createAccount,
    updateAccount,
    deleteAccount,
    isCreatingAccount,
    isUpdatingAccount,
  } = useAccounts();

  const [formOpen, setFormOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const { data: editingAccount, isLoading: isLoadingEditAccount } = useAccountForEdit(
    editingAccountId,
    formOpen && !!editingAccountId,
  );

  const isSubmitting = isCreatingAccount || isUpdatingAccount;

  const positiveAccounts = useMemo(
    () => accounts.filter(account => Number(account.balance) >= 0),
    [accounts],
  );

  const negativeAccounts = useMemo(
    () => accounts.filter(account => Number(account.balance) < 0),
    [accounts],
  );

  const assets = useMemo(
    () => positiveAccounts.reduce((sum, account) => sum + Number(account.balance), 0),
    [positiveAccounts],
  );

  const liabilities = useMemo(
    () => negativeAccounts.reduce((sum, account) => sum + Number(account.balance), 0),
    [negativeAccounts],
  );

  const handleSubmit = async (data: CreateAccountData, accountId?: string) => {
    if (accountId) {
      await updateAccount({ id: accountId, ...data });
    } else {
      await createAccount(data);
    }
    setEditingAccountId(null);
  };

  const handleEdit = (account: Account) => {
    setEditingAccountId(account.id);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedAccountId) return;
    await deleteAccount(selectedAccountId);
    setDeleteOpen(false);
    setSelectedAccountId(null);
  };

  const handleOpenAccount = (accountId: string) => {
    router.push(`/app/accounts/${accountId}`);
  };

  const handleCreateClick = () => {
    setEditingAccountId(null);
    setFormOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingAccountId(null);
  };

  const showEditLoader = formOpen && !!editingAccountId && isLoadingEditAccount;

  return (
    <DashboardLayout
      title="Accounts"
      description="Manage your financial accounts"
      actions={
        <Button onClick={handleCreateClick} className="inline-flex items-center gap-2">
          <Plus size={18} /> Add Account
        </Button>
      }
    >
      <div className="space-y-6">
        <AccountsSummary totalBalance={totalBalance} assets={assets} liabilities={liabilities} />

        <AccountsGrid
          accounts={accounts}
          isLoading={isLoading}
          onCreateClick={handleCreateClick}
          onEdit={handleEdit}
          onDelete={id => {
            setSelectedAccountId(id);
            setDeleteOpen(true);
          }}
          onOpenAccount={handleOpenAccount}
        />
      </div>

      {showEditLoader ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <AccountFormDialog
          open={formOpen && !showEditLoader}
          onOpenChange={handleFormOpenChange}
          onSubmit={handleSubmit}
          editingAccount={editingAccountId ? (editingAccount ?? null) : null}
          isSubmitting={isSubmitting}
        />
      )}

      <DeleteAccountDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}
