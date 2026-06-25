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
import { getById, updateFromRequestBody, remove } from '@/services/repositories/accounts';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = parsePublicId(id);
    if (!publicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const url = new URL(req.url);
    const revealSensitive = url.searchParams.get('reveal') === 'true';

    const account = await getById(user.id, publicId, { revealSensitive });
    if (!account) return notFoundResponse();
    return successResponse(account);
  } catch (error: unknown) {
    return handleRouteError(error, 'Account GET error');
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = parsePublicId(id);
    if (!publicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const body = await req.json().catch(() => ({}));

    const updated = await updateFromRequestBody(user.id, publicId, body);
    if (!updated) return notFoundResponse();

    return successResponse({});
  } catch (error: unknown) {
    return handleRouteError(error, 'Account PUT error');
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = parsePublicId(id);
    if (!publicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const account = await getById(user.id, publicId);
    if (!account) return notFoundResponse();

    await remove(user.id, publicId);
    return successResponse({});
  } catch (error: unknown) {
    return handleRouteError(error, 'Account DELETE error');
  }
}
