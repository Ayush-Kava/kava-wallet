import { NextRequest } from 'next/server';
import { authUser } from '@/lib/auth';
import { parsePublicId } from '@/lib/public-id';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
import { ERRORS } from '@/lib/utils/errors';
import { update, remove } from '@/services/repositories/categories';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = parsePublicId(id);
    if (!publicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const body = await req.json().catch(() => ({}));
    const { name, color, icon } = body;

    if (!name && !color && !icon) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    const category = await update(user.id, publicId, { name, color, icon });
    if (!category) return notFoundResponse();

    return successResponse(category);
  } catch (error: unknown) {
    console.error('Category PUT error', error);
    return handleRouteError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = parsePublicId(id);
    if (!publicId) return errorResponse(ERRORS.GENERIC_BAD_REQUEST);

    const user = await authUser();
    const result = await remove(user.id, publicId);

    if (!result.ok) {
      if (result.reason === 'not_found') return notFoundResponse();
      if (result.reason === 'default_category') {
        return errorResponse({
          code: 'CATEGORY_DELETE_DEFAULT',
          message: 'Default categories cannot be deleted',
          httpStatus: 400,
        });
      }
      if (result.reason === 'has_transactions') {
        return errorResponse({
          code: 'CATEGORY_IN_USE',
          message: 'Cannot delete a category that has transactions',
          httpStatus: 409,
        });
      }
      if (result.reason === 'has_budgets') {
        return errorResponse({
          code: 'CATEGORY_IN_USE',
          message: 'Cannot delete a category that has budgets',
          httpStatus: 409,
        });
      }
    }

    return successResponse({});
  } catch (error: unknown) {
    console.error('Category DELETE error', error);
    return handleRouteError(error);
  }
}
