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
import { remove, update } from '@/services/repositories/budgets';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = parsePublicId(id);
    if (!publicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const body = await req.json().catch(() => ({}));
    const { amount, period, start_date, end_date } = body;

    if (amount === undefined && !period && !start_date && end_date === undefined) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    const updated = await update(user.id, publicId, { amount, period, start_date, end_date });
    if (!updated) return notFoundResponse();

    return successResponse({});
  } catch (error: unknown) {
    console.error('Budget PUT error', error);
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
    console.error('Budget DELETE error', error);
    return handleRouteError(error);
  }
}
