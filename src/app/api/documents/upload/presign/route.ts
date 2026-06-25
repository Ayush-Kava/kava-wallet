import { NextRequest } from 'next/server';
import { authUser } from '@/lib/auth';
import { generatePresignedUploadUrl } from '@/lib/r2';
import {
  successResponse,
  errorResponse } from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
import { ERRORS } from '@/lib/utils/errors';

export async function POST(req: NextRequest) {
  try {
    const user = await authUser();
    const body = await req.json().catch(() => ({}));
    const { filename, contentType } = body;

    if (!filename || !contentType) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    const result = await generatePresignedUploadUrl(user.id, filename, contentType);

    return successResponse(result);
  } catch (error: any) {
    console.error('Document presign error', error);
    return handleRouteError(error);
  }
}
