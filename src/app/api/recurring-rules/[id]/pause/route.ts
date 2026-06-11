import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  notFoundResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
import { setPaused } from '@/services/repositories/recurring-rules';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { paused } = body;

    if (typeof paused !== 'boolean') {
      return notFoundResponse();
    }

    const updated = await setPaused(user.id, id, paused);
    if (!updated) return notFoundResponse();

    return successResponse({});
  } catch (error: any) {
    console.error('Recurring rule pause error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
