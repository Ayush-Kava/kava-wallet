import { z } from 'zod';
import { dateSchema, nonNegativeAmountSchema, publicIdSchema } from './common';

export const accountTypeSchema = z.enum(['cash', 'bank', 'credit_card', 'wallet']);

const sharedFields = {
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
  balance: nonNegativeAmountSchema.optional().default(0),
  currency: z.string().length(3).optional().default('INR'),
  color: z.string().max(20).optional(),
  icon: z.string().max(50).optional(),
};

export const createBankAccountSchema = z.object({
  type: z.literal('bank'),
  ...sharedFields,
  bank_id: publicIdSchema,
  account_number: z
    .string()
    .regex(/^\d+$/, 'Account number must contain digits only')
    .min(4, 'Account number is too short')
    .max(18, 'Account number is too long'),
  ifsc_code: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, 'Enter a valid 11-character IFSC code')
    .transform(v => v.toUpperCase()),
});

export const createCashAccountSchema = z.object({
  type: z.literal('cash'),
  ...sharedFields,
});

export const createWalletAccountSchema = z.object({
  type: z.literal('wallet'),
  ...sharedFields,
  provider: z.string().max(100).optional(),
});

export const createCreditCardAccountSchema = z.object({
  type: z.literal('credit_card'),
  ...sharedFields,
  bank_id: publicIdSchema.optional(),
  card_number: z
    .string()
    .regex(/^\d+$/, 'Card number must contain digits only')
    .min(4, 'Card number is too short')
    .max(19, 'Card number is too long'),
  card_holder_name: z.string().max(100).optional(),
  expiry_date: dateSchema,
  statement_start_date: dateSchema,
  statement_end_date: dateSchema,
  due_date: dateSchema,
  credit_limit: nonNegativeAmountSchema.refine(v => v > 0, 'Credit limit must be greater than zero'),
  min_due: nonNegativeAmountSchema.optional(),
});

export const createAccountSchema = z.discriminatedUnion('type', [
  createBankAccountSchema,
  createCashAccountSchema,
  createWalletAccountSchema,
  createCreditCardAccountSchema,
]);

const updateBankFields = z.object({
  name: sharedFields.name.optional(),
  currency: sharedFields.currency.optional(),
  color: sharedFields.color,
  icon: sharedFields.icon,
  bank_id: publicIdSchema.optional(),
  account_number: z
    .string()
    .regex(/^\d+$/, 'Account number must contain digits only')
    .min(4)
    .max(18)
    .optional(),
  ifsc_code: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, 'Enter a valid 11-character IFSC code')
    .transform(v => v.toUpperCase())
    .optional(),
});

const updateCashFields = z.object({
  name: sharedFields.name.optional(),
  currency: sharedFields.currency.optional(),
  color: sharedFields.color,
  icon: sharedFields.icon,
});

const updateWalletFields = updateCashFields.extend({
  provider: z.string().max(100).optional(),
});

const updateCreditCardFields = z.object({
  name: sharedFields.name.optional(),
  currency: sharedFields.currency.optional(),
  color: sharedFields.color,
  icon: sharedFields.icon,
  bank_id: publicIdSchema.optional().nullable(),
  card_number: z
    .string()
    .regex(/^\d+$/, 'Card number must contain digits only')
    .min(4)
    .max(19)
    .optional(),
  card_holder_name: z.string().max(100).optional().nullable(),
  expiry_date: dateSchema.optional(),
  statement_start_date: dateSchema.optional(),
  statement_end_date: dateSchema.optional(),
  due_date: dateSchema.optional(),
  credit_limit: nonNegativeAmountSchema.optional(),
  min_due: nonNegativeAmountSchema.optional().nullable(),
});

export const updateAccountSchemaByKind = {
  bank: updateBankFields,
  cash: updateCashFields,
  wallet: updateWalletFields,
  credit_card: updateCreditCardFields,
} as const;

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateBankAccountInput = z.infer<typeof updateBankFields>;
export type UpdateCashAccountInput = z.infer<typeof updateCashFields>;
export type UpdateWalletAccountInput = z.infer<typeof updateWalletFields>;
export type UpdateCreditCardAccountInput = z.infer<typeof updateCreditCardFields>;
