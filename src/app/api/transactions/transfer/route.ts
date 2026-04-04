import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  unauthorizedResponse,
  internalServerErrorResponse,
} from '@/lib/utils/response';
import { ERRORS } from '@/lib/utils/errors';
import {
  createTransfer,
  updateTransfer,
} from '@/services/repositories/transactions';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { from_account_id, to_account_id, amount, description, date } = body;

    if (!from_account_id || !to_account_id || !amount || !date) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    await createTransfer(user.id, {
      from_account_id,
      to_account_id,
      amount,
      description,
      date,
    });

    return successResponse({}, 201);
  } catch (error: any) {
    console.error('Transfer POST error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const {
      transfer_id,
      from_account_id,
      to_account_id,
      amount,
      description,
      date,
    } = body;

    if (!transfer_id) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const updated = await updateTransfer(user.id, {
      transfer_id,
      from_account_id,
      to_account_id,
      amount,
      description,
      date,
    });
    if (!updated) return notFoundResponse();
    return successResponse({});
  } catch (error: any) {
    console.error('Transfer PUT error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
