import { z } from 'zod';

export const signupSchema = z.object({
  email: z
    .string()
    .email()
    .transform(v => v.toLowerCase().trim()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().trim().max(100).optional().nullable(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email()
    .transform(v => v.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required'),
});

export const profileUpdateSchema = z.object({
  full_name: z.string().trim().min(1).max(100),
});
