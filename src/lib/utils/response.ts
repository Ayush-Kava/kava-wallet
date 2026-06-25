import { NextResponse } from 'next/server';
import { AppError, ERRORS, toAppError } from './errors';

export const successResponse = (data: any, status: number = 200) => {
  return NextResponse.json({ success: true, data }, { status });
};

export const errorResponse = (error: AppError | string, status?: number) => {
  const appError = toAppError(error);
  return NextResponse.json(
    { success: false, message: appError.message },
    { status: status || appError.httpStatus },
  );
};

export const badRequestResponse = (message?: string, status: number = 400) => {
  return NextResponse.json({ success: false, message }, { status });
};

export const notFoundResponse = (message?: string) => {
  const error = message ? { ...ERRORS.DB_RECORD_NOT_FOUND, message } : ERRORS.DB_RECORD_NOT_FOUND;
  return NextResponse.json(
    { success: false, message: error.message },
    { status: error.httpStatus },
  );
};

export const unauthorizedResponse = (message?: string) => {
  const error = message ? { ...ERRORS.AUTH_REQUIRED, message } : ERRORS.AUTH_REQUIRED;
  return NextResponse.json(
    { success: false, message: error.message },
    { status: error.httpStatus },
  );
};

export const forbiddenResponse = (message?: string) => {
  const error = message ? { ...ERRORS.AUTH_FORBIDDEN, message } : ERRORS.AUTH_FORBIDDEN;
  return NextResponse.json(
    { success: false, message: error.message },
    { status: error.httpStatus },
  );
};

export const insufficientCreditsResponse = (message?: string) => {
  const error = message
    ? { ...ERRORS.AUTH_INSUFFICIENT_CREDITS, message }
    : ERRORS.AUTH_INSUFFICIENT_CREDITS;
  return NextResponse.json(
    { success: false, message: error.message },
    { status: error.httpStatus },
  );
};

export const internalServerErrorResponse = (message?: string) => {
  const error = message
    ? { ...ERRORS.GENERIC_INTERNAL_ERROR, message }
    : ERRORS.GENERIC_INTERNAL_ERROR;
  return NextResponse.json(
    { success: false, message: error.message },
    { status: error.httpStatus },
  );
};

export const validationErrorResponse = (
  message: string,
  errors: Array<{ field: string; message: string }>,
  status: number = ERRORS.VALIDATION_FAILED.httpStatus,
) => {
  return NextResponse.json(
    {
      success: false,
      message,
      errors,
    },
    { status },
  );
};

export const handleFormDataError = (error: any) => {
  if (error instanceof TypeError) {
    const errorMessage = error.message || '';
    if (
      errorMessage.includes('Failed to parse body as FormData') ||
      errorMessage.includes('Content-Type')
    ) {
      return NextResponse.json(
        {
          success: false,
          message: ERRORS.GENERIC_BAD_REQUEST.message,
          details:
            "The server could not process your form data. Make sure you're using multipart/form-data when uploading files.",
          developerNotes: [
            "If using axios, ensure the Content-Type header is set to 'multipart/form-data'",
            "Example: axios.post('/api/applications', formData, { headers: { 'Content-Type': 'multipart/form-data' }})",
            "If using fetch, don't manually set the Content-Type header when sending FormData (the browser will set it)",
            'If still encountering issues, check that your FormData object is properly constructed',
          ],
          originalError: errorMessage,
        },
        { status: ERRORS.GENERIC_BAD_REQUEST.httpStatus },
      );
    }
  }
  return null;
};

export const validateFormDataContentType = (contentType: string) => {
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json(
      {
        success: false,
        message: ERRORS.GENERIC_BAD_REQUEST.message,
        details: 'Content-Type must be multipart/form-data when uploading files.',
      },
      { status: ERRORS.GENERIC_BAD_REQUEST.httpStatus },
    );
  }
  return null;
};
