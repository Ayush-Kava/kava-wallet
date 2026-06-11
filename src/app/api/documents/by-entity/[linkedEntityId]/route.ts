import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
import { listByLinkedEntity } from '@/services/repositories/documents';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ linkedEntityId: string }> },
) {
  try {
    const { linkedEntityId } = await params;
    const user = await requireUser();
    const documents = await listByLinkedEntity(user.id, linkedEntityId);
    return successResponse(documents);
  } catch (error: any) {
    console.error('Documents by entity GET error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
