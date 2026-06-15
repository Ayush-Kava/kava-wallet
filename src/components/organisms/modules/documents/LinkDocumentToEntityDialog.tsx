import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMemo, useState } from 'react';
import type { LinkedEntityType } from '@/types/document-types';
import { useDocuments } from '@/hooks/useDocuments';
import { Loader2 } from 'lucide-react';

interface LinkDocumentToEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: LinkedEntityType;
  entityId: string;
  linkedDocumentIds?: string[];
  onLink: (documentId: string, entityType: LinkedEntityType, entityId: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function LinkDocumentToEntityDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  linkedDocumentIds = [],
  onLink,
  isSubmitting = false,
}: LinkDocumentToEntityDialogProps) {
  const [documentId, setDocumentId] = useState('');
  const { getDocuments } = useDocuments();
  const { data: documents = [], isLoading } = getDocuments;

  const availableDocuments = useMemo(
    () => documents.filter(doc => !linkedDocumentIds.includes(doc.id)),
    [documents, linkedDocumentIds],
  );

  const handleSubmit = async () => {
    if (!documentId) return;
    await onLink(documentId, entityType, entityId);
    setDocumentId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Link Document</DialogTitle>
          <DialogDescription>
            Select a document from your vault to link to this {entityType.replace('_', ' ')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="mr-2 animate-spin" size={16} />
              <span className="text-sm text-muted-foreground">Loading documents...</span>
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-medium">Document</label>
              <Select value={documentId} onValueChange={setDocumentId} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a document" />
                </SelectTrigger>
                <SelectContent>
                  {availableDocuments.length > 0 ? (
                    availableDocuments.map(doc => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No documents available to link
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setDocumentId('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !documentId}>
              {isSubmitting ? 'Linking...' : 'Link Document'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
