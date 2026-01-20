'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useAccounts } from '@/hooks/useAccounts';
import type { Account, CreateAccountData } from '@/types/account-types';
import { Plus } from 'lucide-react';
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
  } = useAccounts();

  const [formOpen, setFormOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editingAccount = useMemo(
    () => accounts.find((account) => account.id === editingAccountId) || null,
    [accounts, editingAccountId],
  );

  const positiveAccounts = useMemo(
    () => accounts.filter((account) => Number(account.balance) >= 0),
    [accounts],
  );

  const negativeAccounts = useMemo(
    () => accounts.filter((account) => Number(account.balance) < 0),
    [accounts],
  );

  const assets = useMemo(
    () =>
      positiveAccounts.reduce(
        (sum, account) => sum + Number(account.balance),
        0,
      ),
    [positiveAccounts],
  );

  const liabilities = useMemo(
    () =>
      negativeAccounts.reduce(
        (sum, account) => sum + Number(account.balance),
        0,
      ),
    [negativeAccounts],
  );

  const handleSubmit = async (data: CreateAccountData, accountId?: string) => {
    setIsSubmitting(true);
    try {
      if (accountId) {
        await updateAccount.mutateAsync({ id: accountId, ...data });
      } else {
        await createAccount.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
      setEditingAccountId(null);
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccountId(account.id);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedAccountId) return;
    await deleteAccount.mutateAsync(selectedAccountId);
    setDeleteOpen(false);
    setSelectedAccountId(null);
  };

  const handleOpenAccount = (accountId: string) => {
    router.push(`/accounts/${accountId}`);
  };

  const handleCreateClick = () => {
    setEditingAccountId(null);
    setFormOpen(true);
  };

  return (
    <DashboardLayout
      title="Accounts"
      description="Manage your financial accounts"
      actions={
        <Button
          onClick={handleCreateClick}
          className="inline-flex items-center gap-2"
        >
          <Plus size={18} /> Add Account
        </Button>
      }
    >
      <div className="space-y-6">
        <AccountsSummary
          totalBalance={totalBalance}
          assets={assets}
          liabilities={liabilities}
        />

        <AccountsGrid
          accounts={accounts}
          isLoading={isLoading}
          onCreateClick={handleCreateClick}
          onEdit={handleEdit}
          onDelete={(id) => {
            setSelectedAccountId(id);
            setDeleteOpen(true);
          }}
          onOpenAccount={handleOpenAccount}
        />
      </div>

      <AccountFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        editingAccount={editingAccount}
        isSubmitting={isSubmitting}
      />

      <DeleteAccountDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}
