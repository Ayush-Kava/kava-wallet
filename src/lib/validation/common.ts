import { z } from 'zod';

export const amountSchema = z.union([z.number(), z.string()]).transform(val => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error('Amount must be a positive number');
  }
  return Math.round(num * 100) / 100;
});

export const uuidSchema = z.string().uuid();

export const dateSchema = z.string().refine(val => !Number.isNaN(Date.parse(val)), {
  message: 'Invalid date',
});

export const parseBody = <T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> => {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.errors.map(e => e.message).join(', ');
    throw new Error(message || 'Invalid request body');
  }
  return result.data;
};

export const parseQuery = <T extends z.ZodTypeAny>(
  schema: T,
  params: Record<string, string | null | undefined>,
): z.infer<T> => {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== null && value !== undefined && value !== '',
    ),
  );
  const result = schema.safeParse(cleaned);
  if (!result.success) {
    const message = result.error.errors.map(e => e.message).join(', ');
    throw new Error(message || 'Invalid query parameters');
  }
  return result.data;
};
