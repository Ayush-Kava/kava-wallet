import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  notFoundResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
import { update, remove } from '@/services/repositories/recurring-rules';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const {
      name,
      description,
      type,
      frequency,
      amount,
      account_id,
      from_account_id,
      to_account_id,
      category_id,
      loan_id,
      next_run_date,
      end_date,
      paused,
    } = body;

    const updated = await update(user.id, id, {
      name,
      description,
      type,
      frequency,
      amount,
      account_id,
      from_account_id,
      to_account_id,
      category_id,
      loan_id,
      next_run_date,
      end_date,
      paused,
    });
    if (!updated) return notFoundResponse();

    return successResponse({});
  } catch (error: any) {
    console.error('Recurring rule PUT error', error);
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
    console.error('Recurring rule DELETE error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
