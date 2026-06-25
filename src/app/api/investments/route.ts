import { NextRequest } from 'next/server';
import { authUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse } from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
import { ERRORS } from '@/lib/utils/errors';
import { create, listByUser } from '@/services/repositories/investments';

export async function GET(_req: NextRequest) {
  try {
    const user = await authUser();
    const investments = await listByUser(user.id);
    return successResponse(investments);
  } catch (error: any) {
    console.error('Investments GET error', error);
    return handleRouteError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authUser();
    const body = await req.json().catch(() => ({}));
    const { name, type, invested_amount, current_value, account_id, start_date, notes } = body;

    if (
      !name ||
      !type ||
      invested_amount == null ||
      current_value == null ||
      !account_id ||
      !start_date
    ) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    const investment = await create(user.id, {
      name,
      type,
      invested_amount,
      current_value,
      account_id,
      start_date,
      notes });

    return successResponse(investment, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
