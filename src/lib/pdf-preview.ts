import type { PDFDocumentProxy } from 'pdfjs-dist';

const pdfDocumentCache = new Map<string, Promise<PDFDocumentProxy>>();

const configurePdfWorker = async () => {
  const pdfjs = await import('pdfjs-dist');
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }
  return pdfjs;
};

export const loadPdfDocument = async (previewUrl: string): Promise<PDFDocumentProxy> => {
  const cached = pdfDocumentCache.get(previewUrl);
  if (cached) return cached;

  const promise = (async () => {
    const pdfjs = await configurePdfWorker();
    const response = await fetch(previewUrl, { credentials: 'include' });

    if (!response.ok) {
      throw new Error('Failed to load PDF preview');
    }

    const data = await response.arrayBuffer();
    return pdfjs.getDocument({ data }).promise;
  })();

  pdfDocumentCache.set(previewUrl, promise);
  return promise;
};
