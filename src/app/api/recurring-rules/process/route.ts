import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
import { processDueRules } from '@/services/repositories/recurring-rules';

export async function GET(_req: NextRequest) {
  try {
    const user = await requireUser();
    const created = await processDueRules(user.id);
    return successResponse({ created });
  } catch (error: any) {
    console.error('Recurring rules process error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}

export async function POST(_req: NextRequest) {
  return GET(_req);
}
