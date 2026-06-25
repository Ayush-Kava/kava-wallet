import { NextRequest } from 'next/server';
import { authUser } from '@/lib/auth';
import {
  successResponse } from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
import { listActive } from '@/services/repositories/banks';

export async function GET(_req: NextRequest) {
  try {
    await authUser();
    const banks = await listActive();
    return successResponse(banks);
  } catch (error: any) {
    console.error('Banks GET error', error);
    return handleRouteError(error);
  }
}
