import { cookies } from 'next/headers';
import { clearSession, SESSION_COOKIE } from '@/lib/auth';
import { successResponse, internalServerErrorResponse } from '@/lib/utils/response';

export async function POST() {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (token) {
      await clearSession(token);
    }

    const response = successResponse({});
    response.cookies.set(SESSION_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: new Date(0),
    });

    return response;
  } catch (error: any) {
    console.error('Logout error', error);
    return internalServerErrorResponse();
  }
}
