import { NextRequest } from 'next/server';
import { authUser } from '@/lib/auth';
import {
  successResponse } from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
import { processDueRules } from '@/services/repositories/recurring-rules';

export async function GET(_req: NextRequest) {
  try {
    const user = await authUser();
    const created = await processDueRules(user.id);
    return successResponse({ created });
  } catch (error: any) {
    console.error('Recurring rules process error', error);
    return handleRouteError(error);
  }
}

export async function POST(_req: NextRequest) {
  return GET(_req);
}
