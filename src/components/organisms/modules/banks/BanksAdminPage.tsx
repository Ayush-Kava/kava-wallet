'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/atoms/ui/table';
import { BankFormDialog } from './BankFormDialog';
import { useAdminBanks } from '@/hooks/useAdminBanks';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/constants/routes';
import type { Bank } from '@/types/account-types';
import { Building2, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

export default function BanksAdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { banks, isLoading, isAdmin, createBank, updateBank, deleteBank } = useAdminBanks();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [deletingBank, setDeletingBank] = useState<Bank | null>(null);

  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') {
      router.replace(ROUTES.settings);
    }
  }, [authLoading, user, router]);

  const openCreate = () => {
    setFormMode('create');
    setEditingBank(null);
    setFormOpen(true);
  };

  const openEdit = (bank: Bank) => {
    setFormMode('edit');
    setEditingBank(bank);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: {
    name: string;
    ifsc_prefix?: string;
    is_active?: boolean;
  }) => {
    if (formMode === 'edit' && editingBank) {
      await updateBank.mutateAsync({
        id: editingBank.id,
        data: {
          name: data.name,
          ifsc_prefix: data.ifsc_prefix,
          is_active: data.is_active,
        },
      });
    } else {
      await createBank.mutateAsync({
        name: data.name,
        ifsc_prefix: data.ifsc_prefix,
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingBank) return;
    await deleteBank.mutateAsync(deletingBank.id);
    setDeletingBank(null);
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeCount = banks.filter(b => b.is_active).length;

  return (
    <DashboardLayout
      title="Banks"
      description="Manage banks available for accounts and credit cards"
      actions={
        <Button onClick={openCreate} className="gap-2">
          <Plus size={18} />
          Add Bank
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border/70 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Banks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{banks.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{activeCount}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{banks.length - activeCount}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              All Banks
            </CardTitle>
            <Button variant="outline" size="sm" onClick={openCreate} className="gap-2">
              <Plus size={16} />
              Add
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading banks...
              </div>
            ) : banks.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No banks yet. Add one to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>IFSC Prefix</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banks.map(bank => (
                    <TableRow key={bank.id}>
                      <TableCell className="font-medium">{bank.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {bank.ifsc_prefix || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={bank.is_active ? 'default' : 'secondary'}>
                          {bank.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(bank)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeletingBank(bank)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <BankFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialBank={editingBank}
        onSubmit={handleFormSubmit}
        isSubmitting={createBank.isPending || updateBank.isPending}
      />

      <AlertDialog open={Boolean(deletingBank)} onOpenChange={() => setDeletingBank(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate bank?</AlertDialogTitle>
            <AlertDialogDescription>
              Deactivate <strong>{deletingBank?.name}</strong>? It will be hidden from new account
              setup. Existing accounts linked to this bank are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBank.isPending ? <Loader2 className="animate-spin" /> : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
