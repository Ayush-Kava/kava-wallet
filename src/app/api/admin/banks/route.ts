import { NextRequest } from 'next/server';
import { authAdmin } from '@/lib/auth';
import { parsePublicId } from '@/lib/public-id';
import { bankFormSchema } from '@/lib/validation/bank';
import { parseBody } from '@/lib/validation/common';
import {
  successResponse,
  errorResponse,
} from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
import { ERRORS } from '@/lib/utils/errors';
import { create, listAll, remove, update } from '@/services/repositories/banks';

export async function GET(_req: NextRequest) {
  try {
    await authAdmin();
    const banks = await listAll();
    return successResponse(banks);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await authAdmin();
    const body = await req.json().catch(() => ({}));
    const data = parseBody(bankFormSchema, body);

    const bank = await create(data.name, data.ifsc_prefix || undefined);
    return successResponse(bank, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await authAdmin();
    const body = await req.json().catch(() => ({}));
    const { publicId: rawPublicId, ...rest } = body as {
      publicId?: string;
      name?: string;
      ifsc_prefix?: string;
      is_active?: boolean;
    };
    const publicId = parsePublicId(rawPublicId ?? '');

    if (!publicId) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    const data = parseBody(bankFormSchema.partial(), rest);

    const bank = await update(publicId, {
      name: data.name,
      ifsc_prefix: data.ifsc_prefix || undefined,
      is_active: data.is_active,
    });

    return successResponse(bank);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await authAdmin();
    const body = await req.json().catch(() => ({}));
    const publicId = parsePublicId(body.publicId);

    if (!publicId) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    await remove(publicId);
    return successResponse({ deactivated: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

