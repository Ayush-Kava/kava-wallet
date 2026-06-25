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
import { setPaused } from '@/services/repositories/recurring-rules';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = parsePublicId(id);
    if (!publicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const body = await req.json().catch(() => ({}));
    const { paused } = body;

    if (typeof paused !== 'boolean') {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    const updated = await setPaused(user.id, publicId, paused);
    if (!updated) return notFoundResponse();

    return successResponse({});
  } catch (error: unknown) {
    console.error('Recurring rule pause error', error);
    return handleRouteError(error);
  }
}
