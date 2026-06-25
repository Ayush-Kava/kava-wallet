'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { useDocuments } from '@/hooks/useDocuments';
import { ReminderForm } from '@/components/organisms/modules/documents/ReminderForm';
import { LinkDocumentDialog } from '@/components/organisms/modules/documents/LinkDocumentDialog';
import { DocumentEditDialog } from '@/components/organisms/modules/documents/DocumentEditDialog';
import { DocumentPreview } from '@/components/organisms/modules/documents/DocumentPreview';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Loader2, Trash2, Archive, Link2, Bell, ArrowLeft, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { ROUTES } from '@/lib/constants/routes';
import type { DocumentReminder, UpdateDocumentReminderData, CreateDocumentReminderData, LinkedEntityType } from '@/types/document-types';
import { parsePublicId } from '@/lib/public-id';
import { cn } from '@/lib/utils';

function DocumentDetailInner({ documentId }: { documentId: string }) {
  const router = useRouter();
  const {
    useDocument,
    updateDocument,
    archiveDocument,
    deleteDocument,
    addDocumentLink,
    removeDocumentLink,
    createReminder,
    updateReminder,
    deleteReminder,
  } = useDocuments();

  const { data: document, isLoading } = useDocument(documentId);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<DocumentReminder | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [deletingReminderId, setDeletingReminderId] = useState<string | null>(null);

  const backButton = (
    <Button variant="outline" size="sm" asChild>
      <Link href={ROUTES.documents} className="gap-2">
        <ArrowLeft size={16} /> Back
      </Link>
    </Button>
  );

  if (isLoading) {
    return (
      <DashboardLayout title="Loading..." description="" actions={backButton}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin" size={24} />
        </div>
      </DashboardLayout>
    );
  }

  if (!document) {
    return (
      <DashboardLayout title="Document Not Found" description="" actions={backButton}>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600">Document not found</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const handleDelete = async () => {
    await deleteDocument.mutateAsync(documentId);
    router.push(ROUTES.documents);
  };

  const handleArchive = async () => {
    await archiveDocument.mutateAsync(documentId);
    router.push(ROUTES.documents);
  };

  const handleAddLink = async (entityType: LinkedEntityType, entityId: string) => {
    await addDocumentLink.mutateAsync({
      document_id: documentId,
      linked_entity_type: entityType,
      linked_entity_id: entityId,
    });
  };

  const handleRemoveLink = async (linkId: string) => {
    await removeDocumentLink.mutateAsync({ linkId, documentId });
  };

  const handleCreateReminder = async (data: any) => {
    await createReminder.mutateAsync(data);
  };

  const handleUpdateReminder = async (
    data: CreateDocumentReminderData | UpdateDocumentReminderData,
  ) => {
    if ('id' in data) {
      await updateReminder.mutateAsync(data);
      setEditingReminder(null);
    }
  };

  const handleToggleReminderComplete = async (reminder: DocumentReminder) => {
    await updateReminder.mutateAsync({
      id: reminder.id,
      document_id: documentId,
      completed: !reminder.completed,
    });
  };

  const handleDeleteReminder = async (reminderId: string) => {
    await deleteReminder.mutateAsync(reminderId);
    setDeletingReminderId(null);
  };

  return (
    <DashboardLayout
      title={document.name}
      description={`Uploaded on ${format(new Date(document.created_at), 'MMM dd, yyyy')}`}
      actions={
        <div className="flex flex-wrap gap-2">
          {backButton}
          <Button
            variant="outline"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2"
          >
            <Pencil size={16} /> Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => setReminderOpen(true)}
            className="inline-flex items-center gap-2"
          >
            <Bell size={16} /> Add Reminder
          </Button>
          <Button
            variant="outline"
            onClick={() => setLinkOpen(true)}
            className="inline-flex items-center gap-2"
          >
            <Link2 size={16} /> Link
          </Button>
          <Button
            variant="outline"
            onClick={handleArchive}
            disabled={archiveDocument.isPending}
            className="inline-flex items-center gap-2"
          >
            <Archive size={16} /> Archive
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
            disabled={deleteDocument.isPending}
            className="inline-flex items-center gap-2"
          >
            <Trash2 size={16} /> Delete
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentPreview document={document} />
          </CardContent>
        </Card>

        {/* Description and Notes */}
        {document.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">{document.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {document.tags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {document.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {document.notes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Linked Entities */}
        {document.links && document.links.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>Linked To</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {document.links.map(link => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between rounded bg-gray-50 p-3 dark:bg-gray-800"
                  >
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {link.linked_entity_type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {link.linked_entity_id}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveLink(link.id)}
                      disabled={removeDocumentLink.isPending}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reminders */}
        {document.reminders && document.reminders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Reminders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...document.reminders]
                  .sort((a, b) => Number(a.completed) - Number(b.completed))
                  .map(reminder => (
                    <div
                      key={reminder.id}
                      className={cn(
                        'rounded border p-3',
                        reminder.completed
                          ? 'border-muted bg-muted/50 opacity-75'
                          : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-1 items-start gap-3">
                          <Checkbox
                            checked={reminder.completed}
                            onCheckedChange={() => handleToggleReminderComplete(reminder)}
                            disabled={updateReminder.isPending}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <p
                              className={cn(
                                'text-sm font-medium',
                                reminder.completed && 'text-muted-foreground line-through',
                              )}
                            >
                              {reminder.title}
                            </p>
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                              {reminder.reminder_type.replace('_', ' ')} on{' '}
                              {format(new Date(reminder.reminder_date), 'MMM dd, yyyy')}
                              {reminder.completed && (
                                <span className="ml-2 font-medium text-success">Completed</span>
                              )}
                            </p>
                            {reminder.description && (
                              <p className="mt-2 text-xs text-gray-700 dark:text-gray-300">
                                {reminder.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingReminder(reminder)}
                            disabled={updateReminder.isPending}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeletingReminderId(reminder.id)}
                            disabled={deleteReminder.isPending}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <DocumentEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        document={document}
        onSubmit={data => updateDocument.mutateAsync(data)}
        isSubmitting={updateDocument.isPending}
      />

      <ReminderForm
        open={reminderOpen}
        onOpenChange={setReminderOpen}
        documentId={documentId}
        onSubmit={handleCreateReminder}
        isSubmitting={createReminder.isPending}
        mode="create"
      />

      <ReminderForm
        open={Boolean(editingReminder)}
        onOpenChange={open => {
          if (!open) setEditingReminder(null);
        }}
        documentId={documentId}
        onSubmit={handleUpdateReminder}
        isSubmitting={updateReminder.isPending}
        mode="edit"
        initialData={editingReminder ?? undefined}
      />

      <LinkDocumentDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        onLink={handleAddLink}
        isSubmitting={addDocumentLink.isPending}
      />

      <AlertDialog open={Boolean(deleteOpen)} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The document will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deletingReminderId)}
        onOpenChange={() => setDeletingReminderId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reminder?</AlertDialogTitle>
            <AlertDialogDescription>
              This reminder will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingReminderId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingReminderId && handleDeleteReminder(deletingReminderId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

function DocumentDetailPage() {
  const params = useParams();
  const documentId = parsePublicId(String(params?.id ?? ''));

  if (!documentId) {
    return (
      <DashboardLayout
        title="Error"
        description=""
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.documents} className="gap-2">
              <ArrowLeft size={16} /> Back
            </Link>
          </Button>
        }
      >
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600">Invalid document ID</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return <DocumentDetailInner documentId={documentId} />;
}

export default function DocumentPage() {
  return <DocumentDetailPage />;
}
