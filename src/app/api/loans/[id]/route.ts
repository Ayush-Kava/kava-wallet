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
import { getById, update, remove } from '@/services/repositories/loans';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = parsePublicId(id);
    if (!publicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const loan = await getById(user.id, publicId);
    if (!loan) return notFoundResponse();
    return successResponse(loan);
  } catch (error: unknown) {
    console.error('Loan GET error', error);
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
      principal,
      interest_rate,
      tenure_months,
      emi_amount,
      start_date,
      account_id,
      category_id,
    } = body;

    const updated = await update(user.id, publicId, {
      name,
      principal,
      interest_rate,
      tenure_months,
      emi_amount,
      start_date,
      account_id,
      category_id,
    });
    if (!updated) return notFoundResponse();

    return successResponse({});
  } catch (error: unknown) {
    console.error('Loan PUT error', error);
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
    console.error('Loan DELETE error', error);
    return handleRouteError(error);
  }
}
