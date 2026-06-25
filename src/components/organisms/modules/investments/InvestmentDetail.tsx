'use client';

import { useState } from 'react';
import { AppLink } from '@/components/atoms/AppLink';
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
import { useDocuments } from '@/hooks/useDocuments';
import { documentsApi } from '@/services/api/documents';
import { LinkDocumentToEntityDialog } from '@/components/organisms/modules/documents/LinkDocumentToEntityDialog';
import { ROUTES } from '@/lib/constants/routes';
import type { LinkedEntityType } from '@/types/document-types';
import { useQuery } from '@tanstack/react-query';
import type { CreateInvestmentData, UpdateInvestmentData } from '@/types/investment-types';
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
  Link as LinkIcon,
} from 'lucide-react';
import { formatDateStr } from '@/lib/ledger-utils';

interface InvestmentDetailProps {
  investmentId: string;
}

export default function InvestmentDetail({ investmentId }: InvestmentDetailProps) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    useInvestment,
    updateInvestment,
    deleteInvestment,
    isUpdatingInvestment,
    isDeletingInvestment,
  } = useInvestments();
  const { data: investment, isLoading } = useInvestment(investmentId);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [linkDocOpen, setLinkDocOpen] = useState(false);

  const { addDocumentLink, removeDocumentLink } = useDocuments({ loadList: false });

  // Fetch linked documents
  const {
    data: linkedDocuments = [],
    isLoading: documentsLoading,
    refetch: refetchLinkedDocuments,
  } = useQuery({
    queryKey: ['investment-documents', investmentId, user?.id],
    queryFn: () => documentsApi.getDocumentsByLinkedEntity('investment', investmentId),
    enabled: !!user && !!investmentId,
  });

  const handleUpdate = async (data: CreateInvestmentData | UpdateInvestmentData) => {
    await updateInvestment({
      id: investmentId,
      ...data,
    } as UpdateInvestmentData);
    setEditOpen(false);
  };

  const handleDelete = async () => {
    await deleteInvestment(investmentId);
    router.push(ROUTES.investments);
  };

  const handleLinkDocument = async (
    documentId: string,
    entityType: LinkedEntityType,
    entityId: string,
  ) => {
    await addDocumentLink.mutateAsync({
      document_id: documentId,
      linked_entity_type: entityType,
      linked_entity_id: entityId,
    });
    await refetchLinkedDocuments();
  };

  const handleUnlinkDocument = async (documentId: string) => {
    const doc = linkedDocuments.find(d => d.id === documentId);
    const link = doc?.links?.find(l => l.linked_entity_id === investmentId);
    if (!link) return;
    await removeDocumentLink.mutateAsync({ linkId: link.id, documentId });
    await refetchLinkedDocuments();
  };

  if (isLoading || !investment) {
    return (
      <DashboardLayout title="Investment Details" description="Loading…">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading investment details…
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
            <AppLink href={ROUTES.investments} className="gap-2">
              <ArrowLeft size={16} /> Back
            </AppLink>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            disabled={isUpdatingInvestment}
            className="gap-2"
          >
            <Pencil size={16} /> Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            disabled={isDeletingInvestment}
            className="gap-2"
          >
            <Trash2 size={16} /> Delete
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Main Details Card */}
        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-xl">Investment Overview</CardTitle>
              <Badge>
                {INVESTMENT_TYPE_LABELS[investment.type as keyof typeof INVESTMENT_TYPE_LABELS]}
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
                  {isPositive ? '+' : ''}₹{Math.abs(returns).toLocaleString('en-IN')}
                </p>
              </div>
              <div
                className={`rounded-lg p-3 ${isPositive ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}
              >
                <p
                  className={`text-xs font-semibold ${isPositive ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}
                >
                  Return %
                </p>
                <p
                  className={`flex items-center gap-1 text-lg font-semibold ${isPositive ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}
                >
                  {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
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
                <p className="font-medium">{investment.accounts?.name || 'Unknown Account'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="font-medium">{formatDateStr(investment.start_date)}</p>
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
        <Card className="border-border/70 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <FileText size={18} />
              Linked Documents
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLinkDocOpen(true)}
              disabled={addDocumentLink.isPending}
              className="gap-2"
            >
              <LinkIcon size={16} /> Link Document
            </Button>
          </CardHeader>
          <CardContent className="text-sm">
            {documentsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading documents...
              </div>
            ) : linkedDocuments.length > 0 ? (
              <div className="space-y-3">
                {linkedDocuments.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-start justify-between rounded-lg border border-border/50 bg-muted/50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <AppLink
                        href={ROUTES.document(doc.id)}
                        className="truncate font-medium hover:underline"
                      >
                        {doc.name}
                      </AppLink>
                      {doc.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {doc.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{doc.file_type.toUpperCase()}</span>
                        <span>•</span>
                        <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    </div>
                    <div className="ml-2 flex flex-shrink-0 gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={16} />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnlinkDocument(doc.id)}
                        disabled={removeDocumentLink.isPending}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No documents linked to this investment.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <LinkDocumentToEntityDialog
        open={linkDocOpen}
        onOpenChange={setLinkDocOpen}
        entityType="investment"
        entityId={investmentId}
        linkedDocumentIds={linkedDocuments.map(d => d.id)}
        onLink={handleLinkDocument}
        isSubmitting={addDocumentLink.isPending}
      />

      {/* Edit Dialog */}
      <InvestmentForm
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleUpdate}
        isSubmitting={isUpdatingInvestment}
        initialData={investment}
        mode="edit"
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Investment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this investment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingInvestment ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
