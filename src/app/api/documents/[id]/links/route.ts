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
import { addLink } from '@/services/repositories/documents';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = parsePublicId(id);
    if (!publicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const body = await req.json().catch(() => ({}));
    const { linked_entity_type, linked_entity_id } = body;
    const linkedEntityPublicId = parsePublicId(linked_entity_id ?? '');

    if (!linked_entity_type || !linkedEntityPublicId) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    const link = await addLink(user.id, {
      document_id: publicId,
      linked_entity_type,
      linked_entity_id: linkedEntityPublicId,
    });
    if (!link) return notFoundResponse();

    return successResponse(link, 201);
  } catch (error) {
    return handleRouteError(error, 'Document link POST error');
  }
}
