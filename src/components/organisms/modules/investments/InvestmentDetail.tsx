'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
import { InvestmentForm } from './InvestmentForm';
import { useInvestments } from '@/hooks/useInvestments';
import { useAuth } from '@/contexts/AuthContext';
import { documentsApi } from '@/services/api/documents';
import { useQuery } from '@tanstack/react-query';
import type {
  CreateInvestmentData,
  UpdateInvestmentData,
} from '@/types/investment-types';
import { INVESTMENT_TYPE_LABELS } from '@/types/investment-types';
import {
  ArrowLeft,
  FileText,
  ExternalLink,
  Pencil,
  Trash2,
  Loader2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { formatDateStr } from '@/lib/ledger-utils';

interface InvestmentDetailProps {
  investmentId: string;
}

export default function InvestmentDetail({
  investmentId,
}: InvestmentDetailProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { useInvestment, updateInvestment, deleteInvestment } =
    useInvestments();
  const { data: investment, isLoading } = useInvestment(investmentId);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Fetch linked documents
  const { data: linkedDocuments = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['investment-documents', investmentId, user?.id],
    queryFn: () =>
      documentsApi.getDocumentsByLinkedEntity(user!.id, investmentId),
    enabled: !!user && !!investmentId,
  });

  const handleUpdate = async (
    data: CreateInvestmentData | UpdateInvestmentData,
  ) => {
    await updateInvestment.mutateAsync({
      id: investmentId,
      ...data,
    } as UpdateInvestmentData);
    setEditOpen(false);
  };

  const handleDelete = async () => {
    await deleteInvestment.mutateAsync(investmentId);
    router.push('/investments');
  };

  if (isLoading || !investment) {
    return (
      <DashboardLayout title="Investment Details" description="Loading…">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading investment
          details…
        </div>
      </DashboardLayout>
    );
  }

  const returns = investment.current_value - investment.invested_amount;
  const returnPercentage = (returns / investment.invested_amount) * 100;
  const isPositive = returns >= 0;

  return (
    <DashboardLayout
      title={investment.name}
      description={`${INVESTMENT_TYPE_LABELS[investment.type as keyof typeof INVESTMENT_TYPE_LABELS]} • Started ${formatDateStr(investment.start_date)}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/investments" className="gap-2">
              <ArrowLeft size={16} /> Back
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            disabled={updateInvestment.isPending}
            className="gap-2"
          >
            <Pencil size={16} /> Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            disabled={deleteInvestment.isPending}
            className="gap-2"
          >
            <Trash2 size={16} /> Delete
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Main Details Card */}
        <Card className="shadow-card border-border/70">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-xl">
                Investment Overview
              </CardTitle>
              <Badge>
                {
                  INVESTMENT_TYPE_LABELS[
                    investment.type as keyof typeof INVESTMENT_TYPE_LABELS
                  ]
                }
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Invested Amount</p>
                <p className="text-lg font-semibold">
                  ₹{investment.invested_amount.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Current Value</p>
                <p className="text-lg font-semibold">
                  ₹{investment.current_value.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Returns</p>
                <p
                  className={`text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
                >
                  {isPositive ? '+' : ''}₹
                  {Math.abs(returns).toLocaleString('en-IN')}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${isPositive ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}
              >
                <p
                  className={`text-xs font-semibold ${isPositive ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}
                >
                  Return %
                </p>
                <p
                  className={`text-lg font-semibold flex items-center gap-1 ${isPositive ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}
                >
                  {isPositive ? (
                    <TrendingUp size={16} />
                  ) : (
                    <TrendingDown size={16} />
                  )}
                  {isPositive ? '+' : ''}
                  {returnPercentage.toFixed(2)}%
                </p>
              </div>
            </div>

            <Separator />

            {/* Additional Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Account</p>
                <p className="font-medium">
                  {investment.accounts?.name || 'Unknown Account'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="font-medium">
                  {formatDateStr(investment.start_date)}
                </p>
              </div>
            </div>

            {investment.notes && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="font-medium">{investment.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Linked Documents Section */}
        <Card className="shadow-card border-border/70">
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <FileText size={18} />
              Linked Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {documentsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading documents...
              </div>
            ) : linkedDocuments.length > 0 ? (
              <div className="space-y-3">
                {linkedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start justify-between p-3 bg-muted/50 rounded-lg border border-border/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.name}</p>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {doc.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{doc.file_type.toUpperCase()}</span>
                        <span>•</span>
                        <span>
                          {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="ml-2 flex-shrink-0"
                    >
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gap-2"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No documents linked to this investment.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <InvestmentForm
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleUpdate}
        isSubmitting={updateInvestment.isPending}
        initialData={investment}
        mode="edit"
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Investment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this investment? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteInvestment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
