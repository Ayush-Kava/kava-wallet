import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession, invalidateAllSessions, SESSION_COOKIE } from '@/lib/auth';
import { loginSchema } from '@/lib/validation/auth';
import { parseBody } from '@/lib/validation/common';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { successResponse, errorResponse, internalServerErrorResponse } from '@/lib/utils/response';
import { ERRORS } from '@/lib/utils/errors';

const sanitizeUser = (user: { id: string; email: string; fullName: string | null }) => ({
  id: user.id,
  email: user.email,
  full_name: user.fullName,
});

export async function POST(request: Request) {
  try {
    if (!rateLimit(`login:${getClientIp(request)}`)) {
      return errorResponse('Too many requests. Try again later.', 429);
    }

    const body = await request.json().catch(() => null);
    const { email, password } = parseBody(loginSchema, body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return errorResponse(ERRORS.AUTH_REQUIRED);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return errorResponse(ERRORS.AUTH_REQUIRED);
    }

    await invalidateAllSessions(user.id);
    const { token, expiresAt } = await createSession(user.id);
    const response = successResponse({ user: sanitizeUser(user) });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: expiresAt,
    });

    return response;
  } catch (error: any) {
    console.error('Login error', error);
    return internalServerErrorResponse();
  }
}
