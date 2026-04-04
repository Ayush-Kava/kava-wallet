import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  unauthorizedResponse,
  internalServerErrorResponse,
} from '@/lib/utils/response';
import { getTransferPairs } from '@/services/repositories/transactions';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const ids = url.searchParams.get('ids');
    const transferIds = ids ? ids.split(',').filter(Boolean) : [];

    const simplified = await getTransferPairs(user.id, transferIds);

    return successResponse(simplified);
  } catch (error: any) {
    console.error('Transfers list error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
