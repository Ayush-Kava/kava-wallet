import { uuidSchema } from '@/lib/validation/common';

export const publicIdSchema = uuidSchema;

export const parsePublicId = (raw: string): string | null => {
  const result = publicIdSchema.safeParse(raw);
  if (!result.success) return null;
  return result.data;
};

export const parsePublicIds = (raw: string[]): string[] | null => {
  const parsed = raw.map(id => parsePublicId(id.trim())).filter((id): id is string => id !== null);
  if (parsed.length !== raw.length) return null;
  return parsed;
};

/** Normalizes a DB/API identifier to a string at the type boundary. */
export const asPublicId = (value: string | number): string => String(value);

export const asNullablePublicId = (
  value: string | number | null | undefined,
): string | null => (value == null ? null : String(value));
