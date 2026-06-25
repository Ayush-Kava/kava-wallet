import { authUser, sanitizeAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';

export async function PUT(request: Request) {
  try {
    const user = await authUser();
    const body = await request.json().catch(() => ({}));
    const fullName = body.full_name?.trim?.() || null;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { fullName },
    });

    return successResponse({ user: sanitizeAuthUser(updated) });
  } catch (error) {
    return handleRouteError(error);
  }
}
