import type { DocumentFileType } from '@/types/document-types';
import { isImageMimeType, isPdfMimeType } from '@/lib/document-file-utils';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

export type DocumentPreviewMode = 'pdf' | 'image' | 'unsupported';

export const getFileExtension = (fileUrl: string): string | null => {
  const sanitized = fileUrl.split('?')[0]?.split('#')[0] ?? '';
  const match = sanitized.match(/\.([a-zA-Z0-9]+)$/);
  return match?.[1]?.toLowerCase() ?? null;
};

export const isAllowedDocumentStorageUrl = (fileUrl: string): boolean => {
  if (!fileUrl) return false;

  if (fileUrl.startsWith('/uploads/')) {
    return true;
  }

  try {
    const url = new URL(fileUrl);
    const isDevHttp = process.env.NODE_ENV === 'development' && url.protocol === 'http:';
    if (url.protocol !== 'https:' && !isDevHttp) {
      return false;
    }

    const publicBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');
    if (publicBase && fileUrl.startsWith(publicBase)) {
      return true;
    }

    if (url.hostname.endsWith('.r2.dev')) {
      return true;
    }

    if (url.hostname.endsWith('.r2.cloudflarestorage.com')) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

export const resolveDocumentFetchUrl = (fileUrl: string): string => {
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  return `${origin.replace(/\/$/, '')}${fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`}`;
};

export const getPreviewMimeType = (
  fileUrl: string,
  options?: {
    mimeType?: string | null;
    fileExtension?: string | null;
    fileType?: string | null;
  },
): string | null => {
  if (options?.mimeType && options.mimeType !== 'application/octet-stream') {
    return options.mimeType;
  }

  const extension = (options?.fileExtension || getFileExtension(fileUrl) || '').toLowerCase();
  if (extension && MIME_BY_EXTENSION[extension]) {
    return MIME_BY_EXTENSION[extension];
  }

  if (options?.fileType === 'pdf') return 'application/pdf';
  if (options?.fileType && ['image', 'scan', 'receipt'].includes(options.fileType)) {
    return 'image/jpeg';
  }

  return null;
};

export const getDocumentPreviewMode = (
  fileUrl: string,
  options?: {
    mimeType?: string | null;
    fileExtension?: string | null;
    fileType?: DocumentFileType | string | null;
  },
): DocumentPreviewMode => {
  const extension = (options?.fileExtension || getFileExtension(fileUrl) || '').toLowerCase();
  const mime = getPreviewMimeType(fileUrl, options);

  if (isImageMimeType(options?.mimeType) || isImageMimeType(mime)) {
    return 'image';
  }

  if (extension && IMAGE_EXTENSIONS.has(extension)) {
    return 'image';
  }

  if (isPdfMimeType(options?.mimeType) || isPdfMimeType(mime) || extension === 'pdf') {
    return 'pdf';
  }

  if (options?.fileType === 'pdf') {
    return 'pdf';
  }

  if (
    options?.fileType &&
    ['image', 'scan', 'receipt'].includes(options.fileType) &&
    extension &&
    IMAGE_EXTENSIONS.has(extension)
  ) {
    return 'image';
  }

  return 'unsupported';
};

export const sanitizeDownloadFilename = (
  name: string,
  fileUrl: string,
  fileExtension?: string | null,
): string => {
  const extension = fileExtension || getFileExtension(fileUrl);
  const safeBase = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'document';
  if (extension && safeBase.toLowerCase().endsWith(`.${extension}`)) {
    return safeBase;
  }
  return extension ? `${safeBase}.${extension}` : safeBase;
};
