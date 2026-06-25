import { z } from 'zod';

export const bankFormSchema = z.object({
  name: z.string().trim().min(1, 'Bank name is required').max(100),
  ifsc_prefix: z
    .string()
    .optional()
    .transform(v => {
      const trimmed = v?.trim().toUpperCase() ?? '';
      if (!trimmed) return undefined;
      if (!/^[A-Z]{4}$/.test(trimmed)) {
        throw new Error('IFSC prefix must be exactly 4 letters');
      }
      return trimmed;
    }),
  is_active: z.boolean().optional(),
});
