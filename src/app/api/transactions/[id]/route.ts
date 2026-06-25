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
import {
  deleteTransaction,
  getDetail,
  updateTransaction,
} from '@/services/repositories/transactions';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = parsePublicId(id);
    if (!publicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const detail = await getDetail(user.id, publicId);
    if (!detail) return notFoundResponse();

    return successResponse(detail);
  } catch (error: unknown) {
    console.error('Transaction GET error', error);
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
    const { account_id, category_id, type, amount, description, date } = body;

    const ok = await updateTransaction(user.id, publicId, {
      account_id,
      category_id,
      type,
      amount,
      description,
      date,
    });
    if (!ok) return notFoundResponse();

    return successResponse({});
  } catch (error: unknown) {
    console.error('Transaction PUT error', error);
    return handleRouteError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = parsePublicId(id);
    if (!publicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const result = await deleteTransaction(user.id, publicId);
    if (!result) return notFoundResponse();
    return successResponse(result);
  } catch (error: unknown) {
    console.error('Transaction DELETE error', error);
    return handleRouteError(error);
  }
}
