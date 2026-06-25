import { NextRequest } from 'next/server';
import { authUser } from '@/lib/auth';
import { parsePublicId } from '@/lib/public-id';
import {
  successResponse,
  errorResponse,
} from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
import { ERRORS } from '@/lib/utils/errors';
import { listByLinkedEntity } from '@/services/repositories/documents';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const entityType = url.searchParams.get('entity_type');
    const entityPublicId = parsePublicId(url.searchParams.get('entity_id') ?? '');

    if (!entityType || !entityPublicId) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    const user = await authUser();
    const documents = await listByLinkedEntity(user.id, entityType, entityPublicId);
    return successResponse(documents);
  } catch (error) {
    return handleRouteError(error, 'Documents by entity GET error');
  }
}
