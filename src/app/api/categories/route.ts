import { NextRequest } from 'next/server';
import { authUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse } from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
import { ERRORS } from '@/lib/utils/errors';
import { create, listForUser } from '@/services/repositories/categories';

export async function GET() {
  try {
    const user = await authUser();
    const categories = await listForUser(user.id);
    return successResponse(categories);
  } catch (error: any) {
    console.error('Categories GET error', error);
    return handleRouteError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authUser();
    const body = await req.json().catch(() => ({}));
    const { name, type, icon = 'tag', color = '#6366F1' } = body;
    if (!name || !type) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const category = await create(user.id, {
      name,
      type,
      icon,
      color });
    return successResponse(category, 201);
  } catch (error: any) {
    console.error('Categories POST error', error);
    return handleRouteError(error);
  }
}
