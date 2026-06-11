import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
import { ERRORS } from '@/lib/utils/errors';
import { create, listByUser } from '@/services/repositories/recurring-rules';

export async function GET(_req: NextRequest) {
  try {
    const user = await requireUser();
    const rules = await listByUser(user.id);
    return successResponse(rules);
  } catch (error: any) {
    console.error('Recurring rules GET error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
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

    if (!name || !type || !frequency || amount == null || !next_run_date) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    await create(user.id, {
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

    return successResponse({}, 201);
  } catch (error: any) {
    console.error('Recurring rules POST error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    if (error?.name === 'OwnershipError') {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }
    return internalServerErrorResponse();
  }
}
