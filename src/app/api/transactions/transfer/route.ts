import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createTransferSchema, updateTransferSchema } from '@/lib/validation/transaction';
import { parseBody } from '@/lib/validation/common';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  unauthorizedResponse,
  internalServerErrorResponse,
} from '@/lib/utils/response';
import { OwnershipError } from '@/services/repositories/accounts/ownership';
import { createTransfer, updateTransfer } from '@/services/repositories/transactions';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const data = parseBody(createTransferSchema, body);

    await createTransfer(user.id, {
      from_account_id: data.from_account_id,
      to_account_id: data.to_account_id,
      amount: data.amount,
      description: data.description ?? undefined,
      date: data.date,
    });

    return successResponse({}, 201);
  } catch (error: unknown) {
    console.error('Transfer POST error', error);
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

export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const data = parseBody(updateTransferSchema, body);

    const updated = await updateTransfer(user.id, {
      transfer_id: data.transfer_id,
      from_account_id: data.from_account_id,
      to_account_id: data.to_account_id,
      amount: data.amount,
      description: data.description ?? undefined,
      date: data.date,
    });
    if (!updated) return notFoundResponse();
    return successResponse({});
  } catch (error: unknown) {
    console.error('Transfer PUT error', error);
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
