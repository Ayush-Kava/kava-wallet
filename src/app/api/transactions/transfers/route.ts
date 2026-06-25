import { NextRequest } from 'next/server';
import { authUser } from '@/lib/auth';
import { parsePublicIds } from '@/lib/public-id';
import {
  successResponse,
  errorResponse,
} from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
import { ERRORS } from '@/lib/utils/errors';
import { getTransferPairs } from '@/services/repositories/transactions';

export async function GET(req: NextRequest) {
  try {
    const user = await authUser();
    const url = new URL(req.url);
    const ids = url.searchParams.get('ids');
    const rawIds = ids ? ids.split(',').map((id) => id.trim()).filter(Boolean) : [];
    const transferIds = rawIds.length ? parsePublicIds(rawIds) : [];

    if (rawIds.length && !transferIds) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    const simplified = await getTransferPairs(user.id, transferIds ?? undefined);

    return successResponse(simplified);
  } catch (error: unknown) {
    console.error('Transfers list error', error);
    return handleRouteError(error);
  }
}
