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
import { getById, update, remove } from '@/services/repositories/goals';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = parsePublicId(id);
    if (!publicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const goal = await getById(user.id, publicId);
    if (!goal) return notFoundResponse();
    return successResponse(goal);
  } catch (error: unknown) {
    console.error('Goal GET error', error);
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
    const { name, target_amount, target_date, priority, notes, status } = body;

    const updated = await update(user.id, publicId, {
      name,
      target_amount,
      target_date,
      priority,
      notes,
      status,
    });
    if (!updated) return notFoundResponse();

    return successResponse({});
  } catch (error: unknown) {
    console.error('Goal PUT error', error);
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
    console.error('Goal DELETE error', error);
    return handleRouteError(error);
  }
}
