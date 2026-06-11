import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  notFoundResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
import { getById, update, remove } from '@/services/repositories/accounts';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const account = await getById(user.id, id);
    if (!account) return notFoundResponse();
    return successResponse(account);
  } catch (error: any) {
    console.error('Account GET error', error);
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
      type,
      currency,
      color,
      icon,
      statement_start_date,
      statement_end_date,
      due_date,
      credit_limit,
      min_due,
    } = body;

    const account = await getById(user.id, id);
    if (!account) return notFoundResponse();

    await update(user.id, id, {
      name,
      type,
      currency,
      color,
      icon,
      statement_start_date,
      statement_end_date,
      due_date,
      credit_limit,
      min_due,
    });

    return successResponse({});
  } catch (error: any) {
    console.error('Account PUT error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const account = await getById(user.id, id);
    if (!account) return notFoundResponse();

    await remove(user.id, id);
    return successResponse({});
  } catch (error: any) {
    console.error('Account DELETE error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
