import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  notFoundResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
import { updateFunding, removeFunding } from '@/services/repositories/goals';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { source_type, source_id, allocated_amount } = body;

    const updated = await updateFunding(user.id, id, {
      source_type,
      source_id,
      allocated_amount,
    });
    if (!updated) return notFoundResponse();

    return successResponse({});
  } catch (error: any) {
    console.error('Goal funding PUT error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const deleted = await removeFunding(user.id, id);
    if (!deleted) return notFoundResponse();
    return successResponse({});
  } catch (error: any) {
    console.error('Goal funding DELETE error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
