import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  internalServerErrorResponse,
} from '@/lib/utils/response';
import { getById, listTransactions } from '@/services/repositories/accounts';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const account = await getById(user.id, id);
    if (!account) return notFoundResponse();

    const transactions = await listTransactions(user.id, id);
    return successResponse(transactions);
  } catch (error: any) {
    console.error('Account transactions GET error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
