import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  notFoundResponse,
  unauthorizedResponse,
  internalServerErrorResponse,
} from '@/lib/utils/response';
import { duplicateTransaction } from '@/services/repositories/transactions';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const result = await duplicateTransaction(user.id, id);
    if (!result) return notFoundResponse();

    return successResponse(result);
  } catch (error: any) {
    console.error('Transaction duplicate error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
