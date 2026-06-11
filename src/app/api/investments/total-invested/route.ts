import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
import { getTotalInvested } from '@/services/repositories/investments';

export async function GET(_req: NextRequest) {
  try {
    const user = await requireUser();
    const total = await getTotalInvested(user.id);
    return successResponse({ total });
  } catch (error: any) {
    console.error('Investments total-invested GET error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
