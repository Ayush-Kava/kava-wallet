import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, unauthorizedResponse } from '@/lib/utils/response';

const sanitizeUser = (user: { id: string; email: string; fullName: string | null }) => ({
  id: user.id,
  email: user.email,
  full_name: user.fullName,
});

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const fullName = body.full_name?.trim?.() || null;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { fullName },
    });

    return successResponse({ user: sanitizeUser(updated) });
  } catch (error: any) {
    console.error('Profile update error', error);
    return unauthorizedResponse();
  }
}
