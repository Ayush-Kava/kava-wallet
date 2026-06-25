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
import { getOutstanding } from '@/services/repositories/loans';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = parsePublicId(id);
    if (!publicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const outstanding = await getOutstanding(user.id, publicId);
    if (outstanding === null) return notFoundResponse();
    return successResponse({ outstanding });
  } catch (error: unknown) {
    console.error('Loan outstanding GET error', error);
    return handleRouteError(error);
  }
}
