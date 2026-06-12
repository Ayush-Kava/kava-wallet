import type { DocumentFileType } from '@/types/document-types';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

const EXTENSION_BY_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

export const extractFileExtension = (filename: string): string | null => {
  const match = filename.trim().match(/\.([a-zA-Z0-9]+)$/);
  return match?.[1]?.toLowerCase() ?? null;
};

export const resolveMimeType = (filename: string, mimeType?: string | null): string => {
  if (mimeType && mimeType !== 'application/octet-stream') {
    return mimeType;
  }

  const extension = extractFileExtension(filename);
  if (extension && MIME_BY_EXTENSION[extension]) {
    return MIME_BY_EXTENSION[extension];
  }

  return 'application/octet-stream';
};

export const resolveFileExtension = (filename: string, mimeType: string): string => {
  const fromName = extractFileExtension(filename);
  if (fromName) return fromName;

  return EXTENSION_BY_MIME[mimeType] ?? 'bin';
};

export const ensureStorageFilename = (filename: string, mimeType: string): string => {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_') || 'document';
  const extension = resolveFileExtension(filename, mimeType);

  if (safeName.toLowerCase().endsWith(`.${extension}`)) {
    return safeName;
  }

  const base = safeName.replace(/\.[a-zA-Z0-9]+$/, '') || 'document';
  return `${base}.${extension}`;
};

export const inferDocumentFileType = (
  mimeType: string,
  fileExtension: string,
): DocumentFileType => {
  if (mimeType === 'application/pdf' || fileExtension === 'pdf') {
    return 'pdf';
  }

  if (mimeType.startsWith('image/') || IMAGE_EXTENSIONS.has(fileExtension)) {
    return 'image';
  }

  return 'scan';
};

export const isImageMimeType = (mimeType?: string | null): boolean =>
  Boolean(mimeType?.startsWith('image/'));

export const isPdfMimeType = (mimeType?: string | null): boolean =>
  mimeType === 'application/pdf';

export const detectMimeTypeFromBuffer = (buffer: Buffer): string | null => {
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === '%PDF') {
    return 'application/pdf';
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }

  if (buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'))) {
    return 'image/gif';
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
};
