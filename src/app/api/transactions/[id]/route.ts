import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  notFoundResponse,
  unauthorizedResponse,
  internalServerErrorResponse,
} from '@/lib/utils/response';
import {
  deleteTransaction,
  getDetail,
  updateTransaction,
} from '@/services/repositories/transactions';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const detail = await getDetail(user.id, id);
    if (!detail) return notFoundResponse();

    return successResponse(detail);
  } catch (error: any) {
    console.error('Transaction GET error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { account_id, category_id, type, amount, description, date } = body;

    const ok = await updateTransaction(user.id, id, {
      account_id,
      category_id,
      type,
      amount,
      description,
      date,
    });
    if (!ok) return notFoundResponse();

    return successResponse({});
  } catch (error: any) {
    console.error('Transaction PUT error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const result = await deleteTransaction(user.id, id);
    if (!result) return notFoundResponse();
    return successResponse(result);
  } catch (error: any) {
    console.error('Transaction DELETE error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
