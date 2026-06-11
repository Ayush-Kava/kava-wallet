import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
import { ERRORS } from '@/lib/utils/errors';
import { create, listByUser } from '@/services/repositories/goals';

export async function GET(_req: NextRequest) {
  try {
    const user = await requireUser();
    const goals = await listByUser(user.id);
    return successResponse(goals);
  } catch (error: any) {
    console.error('Goals GET error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { name, target_amount, target_date, priority, notes, status } = body;

    if (!name || !target_amount || !target_date || !priority) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    const goal = await create(user.id, {
      name,
      target_amount,
      target_date,
      priority,
      notes,
      status,
    });

    return successResponse(goal, 201);
  } catch (error: any) {
    console.error('Goals POST error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
