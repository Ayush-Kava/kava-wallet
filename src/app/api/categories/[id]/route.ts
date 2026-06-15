import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
import { ERRORS } from '@/lib/utils/errors';
import { update, remove } from '@/services/repositories/categories';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { name, color, icon } = body;

    if (!name && !color && !icon) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    const category = await update(user.id, id, { name, color, icon });
    if (!category) return notFoundResponse();

    return successResponse(category);
  } catch (error: any) {
    console.error('Category PUT error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const result = await remove(user.id, id);

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
  } catch (error: any) {
    console.error('Category DELETE error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
