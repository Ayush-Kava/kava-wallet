import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

export const SESSION_COOKIE = 'session_token';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 12);
};

export const verifyPassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

export const createSession = async (userId: string) => {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({ data: { token, userId, expiresAt } });

  return { token, expiresAt };
};

export const clearSession = async (token?: string) => {
  const store = await cookies();
  const resolvedToken = token ?? store.get(SESSION_COOKIE)?.value;
  if (resolvedToken) {
    await prisma.session.deleteMany({ where: { token: resolvedToken } });
  }
};

export const getUserFromSession = async () => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { token } });
    }
    return null;
  }

  return session.user;
};

export const requireUser = async () => {
  const user = await getUserFromSession();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
};
