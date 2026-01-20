'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import { useDocuments } from '@/hooks/useDocuments';
import { ReminderForm } from '@/components/organisms/modules/documents/ReminderForm';
import { LinkDocumentDialog } from '@/components/organisms/modules/documents/LinkDocumentDialog';
import { Button } from '@/components/ui/button';
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
import { Loader2, Trash2, Archive, Link2, Bell } from 'lucide-react';
import { format } from 'date-fns';

function DocumentDetailInner({ documentId }: { documentId: string }) {
  const router = useRouter();
  const {
    useDocument,
    archiveDocument,
    deleteDocument,
    addDocumentLink,
    removeDocumentLink,
    createReminder,
    deleteReminder,
  } = useDocuments();

  const { data: document, isLoading } = useDocument(documentId);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [deletingReminderId, setDeletingReminderId] = useState<string | null>(
    null,
  );

  if (isLoading) {
    return (
      <DashboardLayout title="Loading..." description="">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin" size={24} />
        </div>
      </DashboardLayout>
    );
  }

  if (!document) {
    return (
      <DashboardLayout title="Document Not Found" description="">
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
    router.push('/documents');
  };

  const handleArchive = async () => {
    await archiveDocument.mutateAsync(documentId);
    router.push('/documents');
  };

  const handleAddLink = async (entityType: any, entityId: string) => {
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

  const handleDeleteReminder = async (reminderId: string) => {
    await deleteReminder.mutateAsync(reminderId);
    setDeletingReminderId(null);
  };

  return (
    <DashboardLayout
      title={document.name}
      description={`Uploaded on ${format(new Date(document.created_at), 'MMM dd, yyyy')}`}
      actions={
        <div className="flex gap-2">
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
        {/* Document Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center min-h-[400px] flex items-center justify-center">
              <div className="text-gray-500 dark:text-gray-400">
                <p className="mb-2">
                  {document.file_type.toUpperCase()} Preview
                </p>
                <p className="text-sm">
                  Size: {(document.file_size / 1024 / 1024).toFixed(2)} MB
                </p>
                <a
                  href={document.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block"
                >
                  Open Original File
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description and Notes */}
        {document.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                {document.description}
              </p>
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
                {document.tags.map((tag) => (
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
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
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
                {document.links.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded"
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
                {document.reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{reminder.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {reminder.reminder_type.replace('_', ' ')} on{' '}
                          {format(
                            new Date(reminder.reminder_date),
                            'MMM dd, yyyy',
                          )}
                        </p>
                        {reminder.description && (
                          <p className="text-xs text-gray-700 dark:text-gray-300 mt-2">
                            {reminder.description}
                          </p>
                        )}
                      </div>
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
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <ReminderForm
        open={reminderOpen}
        onOpenChange={setReminderOpen}
        documentId={documentId}
        onSubmit={handleCreateReminder}
        isSubmitting={createReminder.isPending}
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
              This action cannot be undone. The document will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteOpen(false)}>
              Cancel
            </AlertDialogCancel>
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
              onClick={() =>
                deletingReminderId && handleDeleteReminder(deletingReminderId)
              }
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
  const documentId = params?.id as string;

  if (!documentId) {
    return (
      <DashboardLayout title="Error" description="">
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
  return (
    <ProtectedRoute>
      <DocumentDetailPage />
    </ProtectedRoute>
  );
}
