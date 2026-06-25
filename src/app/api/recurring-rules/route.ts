import { NextRequest } from 'next/server';
import { authUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse } from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
import { ERRORS } from '@/lib/utils/errors';
import { create, listByUser } from '@/services/repositories/recurring-rules';

export async function GET(_req: NextRequest) {
  try {
    const user = await authUser();
    const rules = await listByUser(user.id);
    return successResponse(rules);
  } catch (error: any) {
    console.error('Recurring rules GET error', error);
    return handleRouteError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
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
      paused } = body;

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
      paused });

    return successResponse({}, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
