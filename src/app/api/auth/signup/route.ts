import { prisma } from '@/lib/prisma';
import { hashPassword, createSession, SESSION_COOKIE, sanitizeAuthUser } from '@/lib/auth';
import { signupSchema } from '@/lib/validation/auth';
import { parseBody } from '@/lib/validation/common';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { seedDefaultsForUser } from '@/services/repositories/categories';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
export async function POST(request: Request) {
  try {
    if (!rateLimit(`signup:${getClientIp(request)}`)) {
      return errorResponse('Too many requests. Try again later.', 429);
    }

    const body = await request.json().catch(() => null);
    const { email, password, fullName } = parseBody(signupSchema, body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return errorResponse('Unable to create account', 409);
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, fullName: fullName ?? null } });

    await seedDefaultsForUser(user.id);

    const { token, expiresAt } = await createSession(user.id);

    const response = successResponse({ user: sanitizeAuthUser(user) }, 201);

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: expiresAt });

    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
