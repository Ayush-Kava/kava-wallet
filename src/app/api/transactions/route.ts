import { NextRequest } from 'next/server';
import { authUser } from '@/lib/auth';
import { createTransactionSchema, transactionFiltersSchema } from '@/lib/validation/transaction';
import { parseBody, parseQuery } from '@/lib/validation/common';
import {
  successResponse } from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
import { createTransaction, list } from '@/services/repositories/transactions';

export async function GET(req: NextRequest) {
  try {
    const user = await authUser();
    const url = new URL(req.url);
    const params = parseQuery(transactionFiltersSchema, {
      type: url.searchParams.get('type'),
      accountId: url.searchParams.get('accountId'),
      categoryId: url.searchParams.get('categoryId'),
      search: url.searchParams.get('search'),
      page: url.searchParams.get('page') ?? '1',
      limit: url.searchParams.get('limit') ?? '10' });

    const result = await list(user.id, params.page, params.limit, {
      type: params.type === 'income' ? 'Income' : params.type === 'expense' ? 'Expense' : undefined,
      accountId: params.accountId,
      categoryId: params.categoryId,
      search: params.search });

    return successResponse(result);
  } catch (error: unknown) {
    console.error('Transactions GET error', error);
    return handleRouteError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authUser();
    const body = await req.json().catch(() => ({}));
    const data = parseBody(createTransactionSchema, body);

    await createTransaction(user.id, {
      account_id: data.account_id,
      category_id: data.category_id ?? undefined,
      type: data.type,
      amount: data.amount,
      description: data.description ?? undefined,
      date: data.date });

    return successResponse({}, 201);
  } catch (error: unknown) {
    console.error('Transactions POST error', error);
    return handleRouteError(error);
  }
}
