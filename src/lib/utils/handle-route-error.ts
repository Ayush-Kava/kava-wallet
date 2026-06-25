import { InsufficientBalanceError } from '@/lib/insufficient-balance';
import { OwnershipError } from '@/services/repositories/accounts/ownership';
import {
  errorResponse,
  forbiddenResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';

const CLIENT_SAFE_MESSAGES = new Set([
  'Invalid bank',
  'Invalid category',
  'Invalid loan',
  'Invalid request body',
  'Invalid query parameters',
  'Amount must be a positive number',
  'Amount must be zero or greater',
  'Bank is in use and cannot be removed. Deactivate it instead.',
  'Account has transactions and cannot be deleted',
  'Linked entity not found or access denied',
  'Cannot transfer to the same account',
]);

/** Map thrown errors to consistent API responses. */
export const handleRouteError = (error: unknown, logLabel?: string) => {
  if (logLabel) console.error(logLabel, error);

  if (error instanceof InsufficientBalanceError) {
    return errorResponse(error.message, 400);
  }
  if (error instanceof OwnershipError) {
    return errorResponse(error.message, 403);
  }
  if (error instanceof Error && error.message === 'Unauthorized') {
    return unauthorizedResponse();
  }
  if (error instanceof Error && error.message === 'Forbidden') {
    return forbiddenResponse();
  }
  if (error instanceof Error && CLIENT_SAFE_MESSAGES.has(error.message)) {
    return errorResponse(error.message, 400);
  }
  if (error instanceof Error && error.message.includes(',')) {
    // Zod validation messages joined with commas
    return errorResponse(error.message, 422);
  }
  if (error instanceof Error) {
    console.error('Unhandled route error:', error.message);
  }
  return internalServerErrorResponse();
};
