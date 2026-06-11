import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
import { ERRORS } from '@/lib/utils/errors';
import { createReminder } from '@/services/repositories/documents';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: documentId } = await params;
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { reminder_type, reminder_date, title, description } = body;

    if (!reminder_type || !reminder_date || !title) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    const reminder = await createReminder(user.id, {
      document_id: documentId,
      reminder_type,
      reminder_date,
      title,
      description,
    });
    if (!reminder) return notFoundResponse();

    return successResponse(reminder, 201);
  } catch (error: any) {
    console.error('Document reminder POST error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
