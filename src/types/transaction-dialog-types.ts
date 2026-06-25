import { z } from 'zod';
import { optionalPublicIdSchema } from '@/lib/validation/common';

export const transactionDialogDefaultsSchema = z
  .object({
    mode: z.enum(['expense', 'income', 'transfer']).optional(),
    accountId: optionalPublicIdSchema,
    fromAccountId: optionalPublicIdSchema,
    toAccountId: optionalPublicIdSchema,
    categoryId: optionalPublicIdSchema,
    preserveAccountOnSave: z.boolean().optional(),
  })
  .strict();

export type TransactionDialogDefaults = z.infer<typeof transactionDialogDefaultsSchema>;
