import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Document } from '@/types/document-types';
import { File, FileText, Image, Receipt } from 'lucide-react';
import Link from 'next/link';

interface DocumentCardProps {
  document: Document;
  onDelete?: (documentId: string) => void;
}

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'pdf':
      return (
        <FileText className="w-5 h-5 text-red-500" aria-label="PDF file" />
      );
    case 'image':
      return (
        <Image className="w-5 h-5 text-blue-500" aria-label="Image file" />
      );
    case 'scan':
      return (
        <File className="w-5 h-5 text-gray-500" aria-label="Scanned document" />
      );
    case 'receipt':
      return (
        <Receipt className="w-5 h-5 text-green-500" aria-label="Receipt" />
      );
    default:
      return <File className="w-5 h-5" aria-label="Document file" />;
  }
};

export function DocumentCard({ document, onDelete }: DocumentCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div
            className="flex items-start gap-3 flex-1"
            aria-label="Document icon"
          >
            {getFileIcon(document.file_type)}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">
                {document.name}
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                {(document.file_size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {document.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {document.description}
          </p>
        )}

        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {document.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button asChild size="sm" variant="default" className="flex-1">
            <Link href={`/documents/${document.id}`}>View Details</Link>
          </Button>
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(document.id)}
            >
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
