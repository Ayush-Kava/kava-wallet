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
import { listFunding, addFunding } from '@/services/repositories/goals';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = parsePublicId(id);
    if (!publicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const funding = await listFunding(user.id, publicId);
    return successResponse(funding);
  } catch (error) {
    return handleRouteError(error, 'Goal funding GET error');
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = parsePublicId(id);
    if (!publicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const body = await req.json().catch(() => ({}));
    const { source_type, source_id, allocated_amount } = body;
    const sourcePublicId = parsePublicId(source_id ?? '');

    if (!source_type || !sourcePublicId || allocated_amount == null) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    const funding = await addFunding(user.id, {
      goal_id: publicId,
      source_type,
      source_id: sourcePublicId,
      allocated_amount,
    });
    if (!funding) return notFoundResponse();

    return successResponse(funding, 201);
  } catch (error) {
    return handleRouteError(error, 'Goal funding POST error');
  }
}
