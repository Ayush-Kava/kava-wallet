import { NextRequest } from 'next/server';
import { authUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse } from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
import { ERRORS } from '@/lib/utils/errors';
import { create, listByUser } from '@/services/repositories/goals';

export async function GET(_req: NextRequest) {
  try {
    const user = await authUser();
    const goals = await listByUser(user.id);
    return successResponse(goals);
  } catch (error: any) {
    console.error('Goals GET error', error);
    return handleRouteError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authUser();
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
      status });

    return successResponse(goal, 201);
  } catch (error: any) {
    console.error('Goals POST error', error);
    return handleRouteError(error);
  }
}
