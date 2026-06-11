import { z } from 'zod';
import { uuidSchema } from '@/lib/validation/common';

export const transactionDialogDefaultsSchema = z
  .object({
    mode: z.enum(['expense', 'income', 'transfer']).optional(),
    accountId: uuidSchema.optional(),
    fromAccountId: uuidSchema.optional(),
    toAccountId: uuidSchema.optional(),
    categoryId: uuidSchema.optional(),
    preserveAccountOnSave: z.boolean().optional(),
  })
  .strict();

export type TransactionDialogDefaults = z.infer<typeof transactionDialogDefaultsSchema>;
