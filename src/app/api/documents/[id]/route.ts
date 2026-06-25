import { NextRequest } from 'next/server';
import { authUser } from '@/lib/auth';
import { parsePublicId } from '@/lib/public-id';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
import { ERRORS } from '@/lib/utils/errors';
import { getById, update, remove } from '@/services/repositories/documents';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = parsePublicId(id);
    if (!publicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const document = await getById(user.id, publicId);
    if (!document) return notFoundResponse();
    return successResponse(document);
  } catch (error: unknown) {
    console.error('Document GET error', error);
    return handleRouteError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = parsePublicId(id);
    if (!publicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const body = await req.json().catch(() => ({}));
    const {
      name,
      description,
      file_url,
      file_type,
      file_extension,
      mime_type,
      file_size,
      tags,
      notes,
    } = body;

    const updated = await update(user.id, publicId, {
      name,
      description,
      file_url,
      file_type,
      file_extension,
      mime_type,
      file_size,
      tags,
      notes,
    });
    if (!updated) return notFoundResponse();

    return successResponse({});
  } catch (error: unknown) {
    console.error('Document PUT error', error);
    return handleRouteError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = parsePublicId(id);
    if (!publicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const deleted = await remove(user.id, publicId);
    if (!deleted) return notFoundResponse();
    return successResponse({});
  } catch (error: unknown) {
    console.error('Document DELETE error', error);
    return handleRouteError(error);
  }
}
