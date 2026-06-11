import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  notFoundResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
import { getById, update, remove } from '@/services/repositories/loans';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const loan = await getById(user.id, id);
    if (!loan) return notFoundResponse();
    return successResponse(loan);
  } catch (error: any) {
    console.error('Loan GET error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const {
      name,
      principal,
      interest_rate,
      tenure_months,
      emi_amount,
      start_date,
      account_id,
      category_id,
    } = body;

    const updated = await update(user.id, id, {
      name,
      principal,
      interest_rate,
      tenure_months,
      emi_amount,
      start_date,
      account_id,
      category_id,
    });
    if (!updated) return notFoundResponse();

    return successResponse({});
  } catch (error: any) {
    console.error('Loan PUT error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const deleted = await remove(user.id, id);
    if (!deleted) return notFoundResponse();
    return successResponse({});
  } catch (error: any) {
    console.error('Loan DELETE error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
