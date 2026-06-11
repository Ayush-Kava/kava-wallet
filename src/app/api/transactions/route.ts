import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createTransactionSchema, transactionFiltersSchema } from '@/lib/validation/transaction';
import { parseBody, parseQuery } from '@/lib/validation/common';
import {
  successResponse,
  errorResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
import { createTransaction, list } from '@/services/repositories/transactions';
import { OwnershipError } from '@/services/repositories/accounts/ownership';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const params = parseQuery(transactionFiltersSchema, {
      type: url.searchParams.get('type'),
      accountId: url.searchParams.get('accountId'),
      categoryId: url.searchParams.get('categoryId'),
      search: url.searchParams.get('search'),
      page: url.searchParams.get('page') ?? '1',
      limit: url.searchParams.get('limit') ?? '10',
    });

    const result = await list(user.id, params.page, params.limit, {
      type: params.type === 'income' ? 'Income' : params.type === 'expense' ? 'Expense' : undefined,
      accountId: params.accountId,
      categoryId: params.categoryId,
      search: params.search,
    });

    return successResponse(result);
  } catch (error: unknown) {
    console.error('Transactions GET error', error);
    if ((error as Error)?.message === 'Unauthorized') return unauthorizedResponse();
    if (error instanceof Error && error.message) {
      return errorResponse(error.message, 400);
    }
    return internalServerErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const data = parseBody(createTransactionSchema, body);

    await createTransaction(user.id, {
      account_id: data.account_id,
      category_id: data.category_id ?? undefined,
      type: data.type,
      amount: data.amount,
      description: data.description ?? undefined,
      date: data.date,
    });

    return successResponse({}, 201);
  } catch (error: unknown) {
    console.error('Transactions POST error', error);
    if ((error as Error)?.message === 'Unauthorized') return unauthorizedResponse();
    if (error instanceof OwnershipError) {
      return errorResponse(error.message, 403);
    }
    if (error instanceof Error && error.message) {
      return errorResponse(error.message, 400);
    }
    return internalServerErrorResponse();
  }
}
