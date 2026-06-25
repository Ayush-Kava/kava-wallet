'use client';

import { useState } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { DocumentCard } from '@/components/organisms/modules/documents/DocumentCard';
import { DocumentUploadForm } from '@/components/organisms/modules/documents/DocumentUploadForm';
import { Button } from '@/components/atoms/Button';
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
import { Loader2, Upload } from 'lucide-react';

export default function Documents() {
  const { getDocuments, deleteDocument, createDocument } = useDocuments();
  const { data: documents = [], isLoading } = getDocuments;
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (documentId: string) => {
    setDeletingId(documentId);
    try {
      await deleteDocument.mutateAsync(documentId);
      setDeleteId(null);
    } catch (error) {
      console.error('Failed to delete document:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleUploadSubmit = async (data: any) => {
    try {
      await createDocument.mutateAsync(data);
      setShowUploadDialog(false);
    } catch (error) {
      console.error('Failed to upload document:', error);
    }
  };

  const documentToDelete = documents.find(d => d.id === deleteId);

  return (
    <DashboardLayout
        title="Documents"
        description="Store and organize your important documents"
        actions={
          <Button onClick={() => setShowUploadDialog(true)} size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        }
      >
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : documents.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No documents yet. Upload your first document to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {documents.map(document => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  onDelete={id => setDeleteId(id)}
                />
              ))}
            </div>
          )}

          <DocumentUploadForm
            open={showUploadDialog}
            onOpenChange={setShowUploadDialog}
            onSubmit={handleUploadSubmit}
            isSubmitting={createDocument.isPending}
          />

          <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <strong>{documentToDelete?.name}</strong>? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => documentToDelete && handleDelete(documentToDelete.id)}
                  disabled={deletingId !== null}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {deletingId ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardLayout>
  );
}
