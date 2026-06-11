import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
import { ERRORS } from '@/lib/utils/errors';
import { listFunding, addFunding } from '@/services/repositories/goals';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const funding = await listFunding(user.id, id);
    return successResponse(funding);
  } catch (error: any) {
    console.error('Goal funding GET error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: goalId } = await params;
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { source_type, source_id, allocated_amount } = body;

    if (!source_type || !source_id || allocated_amount == null) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    const funding = await addFunding(user.id, {
      goal_id: goalId,
      source_type,
      source_id,
      allocated_amount,
    });
    if (!funding) return notFoundResponse();

    return successResponse(funding, 201);
  } catch (error: any) {
    console.error('Goal funding POST error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
