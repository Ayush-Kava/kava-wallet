import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  notFoundResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
import { getById, update, remove } from '@/services/repositories/investments';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const investment = await getById(user.id, id);
    if (!investment) return notFoundResponse();
    return successResponse(investment);
  } catch (error: any) {
    console.error('Investment GET error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { name, type, invested_amount, current_value, account_id, start_date, notes } = body;

    const updated = await update(user.id, id, {
      name,
      type,
      invested_amount,
      current_value,
      account_id,
      start_date,
      notes,
    });
    if (!updated) return notFoundResponse();

    return successResponse({});
  } catch (error: any) {
    console.error('Investment PUT error', error);
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
    console.error('Investment DELETE error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
