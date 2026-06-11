import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  notFoundResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
import { getOutstanding } from '@/services/repositories/loans';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const outstanding = await getOutstanding(user.id, id);
    if (outstanding === null) return notFoundResponse();
    return successResponse({ outstanding });
  } catch (error: any) {
    console.error('Loan outstanding GET error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
