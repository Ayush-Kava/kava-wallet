import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { uploadDocumentToR2 } from '@/lib/r2';
import {
  successResponse,
  errorResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
import { ERRORS } from '@/lib/utils/errors';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return errorResponse(ERRORS.GENERIC_BAD_REQUEST);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { publicUrl } = await uploadDocumentToR2(
      user.id,
      file.name,
      file.type || 'application/octet-stream',
      buffer,
    );

    return successResponse({ url: publicUrl, publicUrl });
  } catch (error: any) {
    console.error('Document upload error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    if (error?.name === 'AccessDenied' || error?.Code === 'AccessDenied') {
      return errorResponse(
        'R2 access denied. Create an API token with Object Read & Write permission for your bucket, then update R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in .env.',
        502,
      );
    }
    return internalServerErrorResponse();
  }
}

export async function DELETE() {
  try {
    await requireUser();
    return new Response(null, { status: 204 });
  } catch (error: any) {
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
