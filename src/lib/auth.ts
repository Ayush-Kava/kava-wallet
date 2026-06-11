import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

export const SESSION_COOKIE = 'session_token';

const DEFAULT_SESSION_EXPIRE_MINUTES = 60 * 24 * 14;

const getSessionExpireMinutes = () => {
  const parsed = Number(process.env.SESSION_EXPIRE_MINUTES);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_SESSION_EXPIRE_MINUTES;
  }
  return parsed;
};

export const getSessionTtlMs = () => getSessionExpireMinutes() * 60 * 1000;

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 12);
};

export const verifyPassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

export const createSession = async (userId: string) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + getSessionTtlMs());
  await prisma.session.create({ data: { token, userId, expiresAt } });
  return { token, expiresAt };
};

export const invalidateAllSessions = async (userId: string) => {
  await prisma.session.deleteMany({ where: { userId } });
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
  if (!user) throw new Error('Unauthorized');
  return user;
};
