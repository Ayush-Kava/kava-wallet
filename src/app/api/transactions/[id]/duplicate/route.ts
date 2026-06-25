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
import { duplicateTransaction } from '@/services/repositories/transactions';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = parsePublicId(id);
    if (!publicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const result = await duplicateTransaction(user.id, publicId);
    if (!result) return notFoundResponse();

    return successResponse(result);
  } catch (error: unknown) {
    console.error('Transaction duplicate error', error);
    return handleRouteError(error);
  }
}
