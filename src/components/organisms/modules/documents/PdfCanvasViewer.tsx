'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadPdfDocument } from '@/lib/pdf-preview';

interface PdfCanvasViewerProps {
  previewUrl: string;
  title: string;
  onOpenPreviewTab: () => void;
}

function PdfPageCanvas({
  pdf,
  pageNumber,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    let cancelled = false;

    const renderPage = async () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;

      const containerWidth = container.clientWidth || 800;
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = containerWidth / baseViewport.width;
      const viewport = page.getViewport({ scale });
      const context = canvas.getContext('2d');

      if (!context || cancelled) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport, canvas }).promise;
    };

    void renderPage();

    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} className="mx-auto block max-w-full" />
    </div>
  );
}

export function PdfCanvasViewer({
  previewUrl,
  title,
  onOpenPreviewTab,
}: PdfCanvasViewerProps) {
  const [pageNumber, setPageNumber] = useState(1);

  const { data: pdf, isLoading, isError } = useQuery({
    queryKey: ['document-pdf-preview', previewUrl],
    queryFn: () => loadPdfDocument(previewUrl),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isError) {
    return (
      <div className="flex h-[min(70vh,640px)] min-h-[280px] flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="font-medium">PDF preview failed to load</p>
        <p className="text-sm text-muted-foreground">
          Open the preview in a new browser tab instead.
        </p>
        <Button variant="outline" size="sm" onClick={onOpenPreviewTab} className="gap-2">
          <ExternalLink className="h-4 w-4" />
          Open preview
        </Button>
      </div>
    );
  }

  if (isLoading || !pdf) {
    return (
      <div className="flex h-[min(70vh,640px)] min-h-[280px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalPages = pdf.numPages;

  return (
    <div className="flex max-h-[min(70vh,640px)] min-h-[280px] flex-col">
      <div className="flex-1 overflow-y-auto p-4" aria-label={`Preview of ${title}`}>
        <PdfPageCanvas pdf={pdf} pageNumber={pageNumber} />
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2 dark:border-white/12">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber(current => Math.max(1, current - 1))}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pageNumber} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pageNumber >= totalPages}
            onClick={() => setPageNumber(current => Math.min(totalPages, current + 1))}
            className="gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
