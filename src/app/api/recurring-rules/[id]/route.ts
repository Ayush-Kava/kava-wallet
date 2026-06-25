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
import { update, remove } from '@/services/repositories/recurring-rules';

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
      type,
      frequency,
      amount,
      account_id,
      from_account_id,
      to_account_id,
      category_id,
      loan_id,
      next_run_date,
      end_date,
      paused,
    } = body;

    const updated = await update(user.id, publicId, {
      name,
      description,
      type,
      frequency,
      amount,
      account_id,
      from_account_id,
      to_account_id,
      category_id,
      loan_id,
      next_run_date,
      end_date,
      paused,
    });
    if (!updated) return notFoundResponse();

    return successResponse({});
  } catch (error: unknown) {
    console.error('Recurring rule PUT error', error);
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
    console.error('Recurring rule DELETE error', error);
    return handleRouteError(error);
  }
}
