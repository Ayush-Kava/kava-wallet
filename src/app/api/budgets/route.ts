import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
import { ERRORS } from '@/lib/utils/errors';
import { create, listByUser } from '@/services/repositories/budgets';

export async function GET(_req: NextRequest) {
  try {
    const user = await requireUser();
    const budgets = await listByUser(user.id);
    return successResponse(budgets);
  } catch (error: any) {
    console.error('Budgets GET error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { category_id, amount, period, start_date, end_date } = body;

    if (!category_id || !amount || !period || !start_date) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    await create(user.id, {
      category_id,
      amount,
      period,
      start_date,
      end_date,
    });

    return successResponse({}, 201);
  } catch (error: any) {
    console.error('Budgets POST error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
