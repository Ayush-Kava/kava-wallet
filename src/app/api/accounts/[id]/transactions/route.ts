import { NextRequest } from 'next/server';
import { authUser } from '@/lib/auth';
import { parsePublicId } from '@/lib/public-id';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
import { ERRORS } from '@/lib/utils/errors';
import { getById, listTransactions } from '@/services/repositories/accounts';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = parsePublicId(id);
    if (!publicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const account = await getById(user.id, publicId);
    if (!account) return notFoundResponse();

    const transactions = await listTransactions(user.id, publicId);
    return successResponse(transactions);
  } catch (error: unknown) {
    console.error('Account transactions GET error', error);
    return handleRouteError(error);
  }
}
