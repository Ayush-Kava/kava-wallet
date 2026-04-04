import { getUserFromSession } from '@/lib/auth';
import {
  successResponse,
  internalServerErrorResponse,
} from '@/lib/utils/response';

const sanitizeUser = (user: {
  id: string;
  email: string;
  fullName: string | null;
}) => ({
  id: user.id,
  email: user.email,
  full_name: user.fullName,
});

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return successResponse({ user: null });
    }

    return successResponse({ user: sanitizeUser(user) });
  } catch (error: any) {
    console.error('Auth me error', error);
    return internalServerErrorResponse();
  }
}
