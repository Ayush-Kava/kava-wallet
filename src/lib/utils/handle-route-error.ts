import { InsufficientBalanceError } from '@/lib/insufficient-balance';
import { OwnershipError } from '@/services/repositories/accounts/ownership';
import {
  errorResponse,
  forbiddenResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
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
  if (error instanceof Error && error.message) {
    return errorResponse(error.message, 400);
  }
  return internalServerErrorResponse();
};
