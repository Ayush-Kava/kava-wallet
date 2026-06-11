import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
import { ERRORS } from '@/lib/utils/errors';
import { create, listByUser } from '@/services/repositories/documents';

export async function GET(_req: NextRequest) {
  try {
    const user = await requireUser();
    const documents = await listByUser(user.id);
    return successResponse(documents);
  } catch (error: any) {
    console.error('Documents GET error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { name, description, file_url, file_type, file_size, tags, notes } = body;

    if (!name || !file_url || !file_type || file_size == null) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    const document = await create(user.id, {
      name,
      description,
      file_url,
      file_type,
      file_size,
      tags,
      notes,
    });

    return successResponse(document, 201);
  } catch (error: any) {
    console.error('Documents POST error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
