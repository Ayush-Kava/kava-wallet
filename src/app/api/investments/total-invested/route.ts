import { NextRequest } from 'next/server';
import { authUser } from '@/lib/auth';
import {
  successResponse } from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
import { getTotalInvested } from '@/services/repositories/investments';

export async function GET(_req: NextRequest) {
  try {
    const user = await authUser();
    const total = await getTotalInvested(user.id);
    return successResponse({ total });
  } catch (error: any) {
    console.error('Investments total-invested GET error', error);
    return handleRouteError(error);
  }
}
