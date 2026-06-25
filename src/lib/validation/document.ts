import { z } from 'zod';
import { publicIdSchema } from './common';

export const linkedEntityTypeSchema = z.enum([
  'transaction',
  'credit_card',
  'loan',
  'emi',
  'account',
  'investment',
]);

export const createDocumentLinkSchema = z.object({
  linked_entity_type: linkedEntityTypeSchema,
  linked_entity_id: publicIdSchema,
});

export const documentByEntityQuerySchema = z.object({
  entity_type: linkedEntityTypeSchema,
  entity_id: publicIdSchema,
});
