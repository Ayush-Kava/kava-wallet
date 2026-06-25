import { NextRequest } from 'next/server';
import { authUser } from '@/lib/auth';
import { parsePublicId } from '@/lib/public-id';
import { detectMimeTypeFromBuffer } from '@/lib/document-file-utils';
import {
  getDocumentPreviewMode,
  getPreviewMimeType,
  isAllowedDocumentStorageUrl,
  resolveDocumentFetchUrl,
  sanitizeDownloadFilename,
} from '@/lib/document-preview-utils';
import {
  errorResponse,
  notFoundResponse,
} from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
import { ERRORS } from '@/lib/utils/errors';
import { getById } from '@/services/repositories/documents';

const MAX_PREVIEW_BYTES = 25 * 1024 * 1024;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = parsePublicId(id);
    if (!publicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const document = await getById(user.id, publicId);

    if (!document) {
      return notFoundResponse();
    }

    if (!isAllowedDocumentStorageUrl(document.file_url)) {
      return errorResponse('Preview is not available for this file location.', 403);
    }

    const sourceResponse = await fetch(resolveDocumentFetchUrl(document.file_url), {
      cache: 'no-store',
    });

    if (!sourceResponse.ok) {
      return errorResponse('Failed to load document from storage.', 502);
    }

    const contentLength = Number(sourceResponse.headers.get('content-length') ?? 0);
    if (contentLength > MAX_PREVIEW_BYTES) {
      return errorResponse('File is too large to preview.', 413);
    }

    const fileBuffer = Buffer.from(await sourceResponse.arrayBuffer());
    if (fileBuffer.byteLength > MAX_PREVIEW_BYTES) {
      return errorResponse('File is too large to preview.', 413);
    }

    const storedPreviewOptions = {
      mimeType: document.mime_type,
      fileExtension: document.file_extension,
      fileType: document.file_type,
    };

    const responseMimeType = sourceResponse.headers.get('content-type')?.split(';')[0]?.trim();
    const detectedMimeType = detectMimeTypeFromBuffer(fileBuffer);
    const resolvedMimeType =
      getPreviewMimeType(document.file_url, storedPreviewOptions) ??
      (responseMimeType && responseMimeType !== 'application/octet-stream' ? responseMimeType : null) ??
      detectedMimeType;

    const previewOptions = {
      ...storedPreviewOptions,
      mimeType: resolvedMimeType ?? storedPreviewOptions.mimeType,
    };

    const previewMode = getDocumentPreviewMode(document.file_url, previewOptions);
    if (previewMode === 'unsupported') {
      return errorResponse('This file type cannot be previewed inline.', 415);
    }

    const mimeType = resolvedMimeType;
    if (!mimeType) {
      return errorResponse('Unable to determine a safe preview type for this file.', 415);
    }

    const download = req.nextUrl.searchParams.get('download') === '1';
    const filename = sanitizeDownloadFilename(
      document.name,
      document.file_url,
      document.file_extension,
    );

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(fileBuffer.byteLength),
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${filename}"`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store, max-age=0',
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
