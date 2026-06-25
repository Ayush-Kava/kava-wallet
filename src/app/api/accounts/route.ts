import { NextRequest } from 'next/server';
import { authUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse } from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
import { ERRORS } from '@/lib/utils/errors';
import { create, listByUser } from '@/services/repositories/accounts';
import type { CreateAccountData } from '@/types/account-types';

export async function GET(_req: NextRequest) {
  try {
    const user = await authUser();
    const accounts = await listByUser(user.id);
    return successResponse(accounts);
  } catch (error: any) {
    console.error('Accounts GET error', error);
    return handleRouteError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authUser();
    const body = await req.json().catch(() => ({}));

    if (!body.name || !body.type) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    const data = body as CreateAccountData;
    await create(user.id, data);

    return successResponse({}, 201);
  } catch (error: any) {
    console.error('Accounts POST error', error);
    return handleRouteError(error);
  }
}
