import { z } from 'zod';
import { amountSchema, dateSchema } from './common';

export const accountTypeSchema = z.enum(['cash', 'bank', 'credit_card', 'wallet']);

export const createAccountSchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: accountTypeSchema,
  balance: amountSchema.optional().default(0),
  currency: z.string().length(3).default('INR'),
  color: z.string().max(20).optional(),
  icon: z.string().max(50).optional(),
  statement_start_date: dateSchema.optional().nullable(),
  statement_end_date: dateSchema.optional().nullable(),
  due_date: dateSchema.optional().nullable(),
  credit_limit: amountSchema.optional().nullable(),
  min_due: amountSchema.optional().nullable(),
});

export const updateAccountSchema = createAccountSchema.omit({ balance: true }).partial();
