import { NextRequest } from 'next/server';
import { authAdmin } from '@/lib/auth';
import { parsePublicId } from '@/lib/public-id';
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
    const { name, ifsc_prefix } = body;

    if (!name || typeof name !== 'string') {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    const bank = await create(name.trim(), ifsc_prefix?.trim());
    return successResponse(bank, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await authAdmin();
    const body = await req.json().catch(() => ({}));
    const { publicId: rawPublicId, name, ifsc_prefix, is_active } = body;
    const publicId = parsePublicId(rawPublicId);

    if (!publicId) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    const bank = await update(publicId, {
      name: typeof name === 'string' ? name.trim() : undefined,
      ifsc_prefix: typeof ifsc_prefix === 'string' ? ifsc_prefix.trim() : undefined,
      is_active: typeof is_active === 'boolean' ? is_active : undefined,
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
    return successResponse({});
  } catch (error) {
    return handleRouteError(error);
  }
}
