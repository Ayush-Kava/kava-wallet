import { NextRequest } from 'next/server';
import { authUser } from '@/lib/auth';
import { documentByEntityQuerySchema } from '@/lib/validation/document';
import { parseQuery } from '@/lib/validation/common';
import { successResponse } from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
import { listByLinkedEntity } from '@/services/repositories/documents';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const params = parseQuery(documentByEntityQuerySchema, {
      entity_type: url.searchParams.get('entity_type'),
      entity_id: url.searchParams.get('entity_id'),
    });

    const user = await authUser();
    const documents = await listByLinkedEntity(user.id, params.entity_type, params.entity_id);
    return successResponse(documents);
  } catch (error) {
    return handleRouteError(error, 'Documents by entity GET error');
  }
}
