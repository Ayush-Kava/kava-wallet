import { NextRequest } from 'next/server';
import { authUser } from '@/lib/auth';
import { createAccountSchema } from '@/lib/validation/account';
import { parseBody } from '@/lib/validation/common';
import { successResponse } from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
import { create, listByUser } from '@/services/repositories/accounts';

export async function GET(_req: NextRequest) {
  try {
    const user = await authUser();
    const accounts = await listByUser(user.id);
    return successResponse(accounts);
  } catch (error: unknown) {
    return handleRouteError(error, 'Accounts GET error');
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authUser();
    const body = await req.json().catch(() => ({}));
    const data = parseBody(createAccountSchema, body);

    await create(user.id, data);

    return successResponse({}, 201);
  } catch (error: unknown) {
    return handleRouteError(error, 'Accounts POST error');
  }
}
