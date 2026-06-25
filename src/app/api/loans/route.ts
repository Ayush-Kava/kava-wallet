import { NextRequest } from 'next/server';
import { authUser } from '@/lib/auth';
import { calculateEmi } from '@/lib/money';
import {
  successResponse,
  errorResponse } from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
import { ERRORS } from '@/lib/utils/errors';
import { create, listByUser } from '@/services/repositories/loans';

export async function GET(_req: NextRequest) {
  try {
    const user = await authUser();
    const loans = await listByUser(user.id);
    return successResponse(loans);
  } catch (error: any) {
    console.error('Loans GET error', error);
    return handleRouteError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
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
      category_id } = body;

    if (
      !name ||
      principal == null ||
      interest_rate == null ||
      !tenure_months ||
      !start_date ||
      !account_id
    ) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    const resolvedEmi = emi_amount ?? calculateEmi(principal, interest_rate, tenure_months);

    const loan = await create(user.id, {
      name,
      principal,
      interest_rate,
      tenure_months,
      emi_amount: resolvedEmi,
      start_date,
      account_id,
      category_id });

    return successResponse(loan, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
