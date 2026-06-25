import { z } from 'zod';
import { amountSchema, dateSchema, publicIdSchema, optionalPublicIdSchema } from './common';

export const createTransactionSchema = z.object({
  account_id: publicIdSchema,
  category_id: publicIdSchema.optional().nullable(),
  type: z.enum(['income', 'expense']),
  amount: amountSchema,
  description: z.string().max(500).optional().nullable(),
  date: dateSchema,
});

export const createTransferSchema = z
  .object({
    from_account_id: publicIdSchema,
    to_account_id: publicIdSchema,
    amount: amountSchema,
    description: z.string().max(500).optional().nullable(),
    date: dateSchema,
  })
  .refine(data => data.from_account_id !== data.to_account_id, {
    message: 'Cannot transfer to the same account',
    path: ['to_account_id'],
  });

export const updateTransferSchema = z
  .object({
    transfer_id: publicIdSchema,
    from_account_id: publicIdSchema,
    to_account_id: publicIdSchema,
    amount: amountSchema,
    description: z.string().max(500).optional().nullable(),
    date: dateSchema,
  })
  .refine(data => data.from_account_id !== data.to_account_id, {
    message: 'Cannot transfer to the same account',
    path: ['to_account_id'],
  });

export const transactionFiltersSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  accountId: optionalPublicIdSchema,
  categoryId: optionalPublicIdSchema,
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(10),
});
