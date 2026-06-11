export type AppError = {
  code: string;
  message: string;
  httpStatus: number;
};

export const ERRORS: Record<string, AppError> = {
  DB_RECORD_NOT_FOUND: {
    code: 'DB_RECORD_NOT_FOUND',
    message: 'Record not found',
    httpStatus: 404,
  },
  AUTH_REQUIRED: {
    code: 'AUTH_REQUIRED',
    message: 'Authentication required',
    httpStatus: 401,
  },
  AUTH_INSUFFICIENT_CREDITS: {
    code: 'AUTH_INSUFFICIENT_CREDITS',
    message: 'Insufficient credits',
    httpStatus: 402,
  },
  GENERIC_INTERNAL_ERROR: {
    code: 'GENERIC_INTERNAL_ERROR',
    message: 'Internal server error',
    httpStatus: 500,
  },
  GENERIC_BAD_REQUEST: {
    code: 'GENERIC_BAD_REQUEST',
    message: 'Bad request',
    httpStatus: 400,
  },
  VALIDATION_FAILED: {
    code: 'VALIDATION_FAILED',
    message: 'Validation failed',
    httpStatus: 422,
  },
};

export const toAppError = (error: AppError | string, fallback?: AppError): AppError => {
  if (typeof error !== 'string') return error;
  return fallback ?? { code: 'GENERIC_BAD_REQUEST', message: error, httpStatus: 400 };
};
