'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Download, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Document } from '@/types/document-types';
import {
  getDocumentPreviewMode,
  isAllowedDocumentStorageUrl,
} from '@/lib/document-preview-utils';
import { isImageMimeType, isPdfMimeType } from '@/lib/document-file-utils';
import { PdfCanvasViewer } from '@/components/organisms/modules/documents/PdfCanvasViewer';

interface DocumentPreviewProps {
  document: Pick<
    Document,
    'id' | 'name' | 'file_type' | 'file_extension' | 'mime_type' | 'file_size' | 'file_url'
  >;
}

const resolvePreviewModeFromMime = (mimeType: string | null | undefined) => {
  if (isImageMimeType(mimeType)) return 'image' as const;
  if (isPdfMimeType(mimeType)) return 'pdf' as const;
  return null;
};

export function DocumentPreview({ document }: DocumentPreviewProps) {
  const [loadError, setLoadError] = useState(false);

  const storedPreviewMode = useMemo(
    () =>
      getDocumentPreviewMode(document.file_url, {
        mimeType: document.mime_type,
        fileExtension: document.file_extension,
        fileType: document.file_type,
      }),
    [document.file_extension, document.file_type, document.file_url, document.mime_type],
  );

  const previewUrl = `/api/documents/${document.id}/preview`;
  const downloadUrl = `${previewUrl}?download=1`;
  const canUseSafePreview =
    isAllowedDocumentStorageUrl(document.file_url) && storedPreviewMode !== 'unsupported';

  const {
    data: previewAsset,
    isLoading: isPreviewLoading,
    isError: isPreviewError,
  } = useQuery({
    queryKey: ['document-preview-asset', document.id],
    queryFn: async () => {
      const response = await fetch(previewUrl, { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to load preview');
      }

      const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() ?? '';
      const blob = await response.blob();

      return {
        contentType,
        objectUrl: URL.createObjectURL(blob),
      };
    },
    enabled: canUseSafePreview,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const previewMode =
    resolvePreviewModeFromMime(previewAsset?.contentType) ?? storedPreviewMode;

  const openOriginal = () => {
    window.open(document.file_url, '_blank', 'noopener,noreferrer');
  };

  const openPreviewTab = () => {
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  if (!canUseSafePreview) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
        <FileText className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="font-medium">Inline preview unavailable</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open the original file in a new tab to view it safely.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={openOriginal} className="gap-2">
          <ExternalLink size={16} />
          Open original file
        </Button>
      </div>
    );
  }

  if (loadError || isPreviewError) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-destructive/40 bg-destructive/5 p-8 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div>
          <p className="font-medium">Preview failed to load</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try downloading the file or opening the original in a new tab.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={downloadUrl} className="gap-2">
              <Download size={16} />
              Download
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={openPreviewTab} className="gap-2">
            <ExternalLink size={16} />
            Open preview
          </Button>
          <Button variant="outline" size="sm" onClick={openOriginal} className="gap-2">
            <ExternalLink size={16} />
            Open original
          </Button>
        </div>
      </div>
    );
  }

  if (isPreviewLoading && !previewAsset) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-border bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
        {previewMode === 'image' ? (
          <div className="flex max-h-[min(70vh,640px)] min-h-[280px] items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewAsset?.objectUrl ?? previewUrl}
              alt={`Preview of ${document.name}`}
              className="max-h-[min(68vh,600px)] w-auto max-w-full rounded-md object-contain"
              referrerPolicy="no-referrer"
              onError={() => setLoadError(true)}
            />
          </div>
        ) : (
          <PdfCanvasViewer
            previewUrl={previewUrl}
            title={document.name}
            onOpenPreviewTab={openPreviewTab}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          {document.file_type.toUpperCase()} · {(document.file_size / 1024 / 1024).toFixed(2)} MB
        </span>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={downloadUrl} className="gap-2">
              <Download size={16} />
              Download
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={openPreviewTab} className="gap-2">
            <ExternalLink size={16} />
            Open preview
          </Button>
          <Button variant="outline" size="sm" onClick={openOriginal} className="gap-2">
            <ExternalLink size={16} />
            Open original
          </Button>
        </div>
      </div>
    </div>
  );
}
