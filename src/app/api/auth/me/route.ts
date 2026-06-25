import { getUserFromSession, sanitizeAuthUser } from '@/lib/auth';
import { successResponse } from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return successResponse({ user: null });
    }

    return successResponse({ user: sanitizeAuthUser(user) });
  } catch (error) {
    return handleRouteError(error);
  }
}
