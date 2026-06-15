import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
import { ERRORS } from '@/lib/utils/errors';
import { remove, update } from '@/services/repositories/budgets';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { amount, period, start_date, end_date } = body;

    if (amount === undefined && !period && !start_date && end_date === undefined) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    const updated = await update(user.id, id, { amount, period, start_date, end_date });
    if (!updated) return notFoundResponse();

    return successResponse({});
  } catch (error: any) {
    console.error('Budget PUT error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const deleted = await remove(user.id, id);
    if (!deleted) return notFoundResponse();
    return successResponse({});
  } catch (error: any) {
    console.error('Budget DELETE error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
