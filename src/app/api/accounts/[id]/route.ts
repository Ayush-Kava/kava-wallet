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
import { getById, update, remove } from '@/services/repositories/accounts';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = parsePublicId(id);
    if (!publicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const account = await getById(user.id, publicId);
    if (!account) return notFoundResponse();
    return successResponse(account);
  } catch (error: unknown) {
    console.error('Account GET error', error);
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

    const account = await getById(user.id, publicId);
    if (!account) return notFoundResponse();

    await update(user.id, publicId, body);

    return successResponse({});
  } catch (error: unknown) {
    console.error('Account PUT error', error);
    return handleRouteError(error);
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
    console.error('Account DELETE error', error);
    return handleRouteError(error);
  }
}
