import { NextRequest } from 'next/server';
import { authUser } from '@/lib/auth';
import { parsePublicId } from '@/lib/public-id';
import {
  successResponse,
  errorResponse,
} from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
import { ERRORS } from '@/lib/utils/errors';
import { listByAccount } from '@/services/repositories/investments';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const accountPublicId = parsePublicId(url.searchParams.get('account_id') ?? '');
    if (!accountPublicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const investments = await listByAccount(user.id, accountPublicId);
    return successResponse(investments);
  } catch (error: unknown) {
    console.error('Investments by account GET error', error);
    return handleRouteError(error);
  }
}
