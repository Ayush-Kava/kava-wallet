import { NextRequest } from 'next/server';
import { authUser } from '@/lib/auth';
import { parsePublicId } from '@/lib/public-id';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
import { ERRORS } from '@/lib/utils/errors';
import { createReminder } from '@/services/repositories/documents';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = parsePublicId(id);
    if (!publicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const body = await req.json().catch(() => ({}));
    const { reminder_type, reminder_date, title, description } = body;

    if (!reminder_type || !reminder_date || !title) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    const reminder = await createReminder(user.id, {
      document_id: publicId,
      reminder_type,
      reminder_date,
      title,
      description,
    });
    if (!reminder) return notFoundResponse();

    return successResponse(reminder, 201);
  } catch (error: unknown) {
    console.error('Document reminder POST error', error);
    return handleRouteError(error);
  }
}
