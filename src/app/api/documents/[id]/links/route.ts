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
import { addLink } from '@/services/repositories/documents';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: documentId } = await params;
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { linked_entity_type, linked_entity_id } = body;

    if (!linked_entity_type || !linked_entity_id) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    const link = await addLink(user.id, {
      document_id: documentId,
      linked_entity_type,
      linked_entity_id,
    });
    if (!link) return notFoundResponse();

    return successResponse(link, 201);
  } catch (error: any) {
    console.error('Document link POST error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
