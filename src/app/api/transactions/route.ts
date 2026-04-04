import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
import { ERRORS } from '@/lib/utils/errors';
import { createTransaction, list } from '@/services/repositories/transactions';

const parseFilters = (req: NextRequest) => {
  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const account = url.searchParams.get('account');
  const category = url.searchParams.get('category');
  const page = Number(url.searchParams.get('page') || '1');
  const limit = Number(url.searchParams.get('limit') || '10');
  return { type, account, category, page, limit };
};

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { type, account, category, page, limit } = parseFilters(req);

    const result = await list(user.id, page, limit, {
      type: type as any,
      account: account || undefined,
      category: category || undefined,
    });

    return successResponse(result);
  } catch (error: any) {
    console.error('Transactions GET error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { account_id, category_id, type, amount, description, date } = body;

    if (!account_id || !type || !amount || !date) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    await createTransaction(user.id, {
      account_id,
      category_id,
      type,
      amount,
      description,
      date,
    });

    return successResponse({}, 201);
  } catch (error: any) {
    console.error('Transactions POST error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
