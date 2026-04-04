import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
import { ERRORS } from '@/lib/utils/errors';
import { create, listByUser } from '@/services/repositories/accounts';

export async function GET(_req: NextRequest) {
  try {
    const user = await requireUser();
    const accounts = await listByUser(user.id);
    return successResponse(accounts);
  } catch (error: any) {
    console.error('Accounts GET error', error);
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
      type,
      balance = 0,
      currency = 'INR',
      color = '#10B981',
      icon = 'wallet',
      statement_start_date,
      statement_end_date,
      due_date,
      credit_limit,
      min_due,
    } = body;

    if (!name || !type) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    await create(user.id, {
      name,
      type,
      balance,
      currency,
      color,
      icon,
      statement_start_date,
      statement_end_date,
      due_date,
      credit_limit,
      min_due,
    });

    return successResponse({}, 201);
  } catch (error: any) {
    console.error('Accounts POST error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
