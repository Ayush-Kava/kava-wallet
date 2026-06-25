import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import type { ZodError } from 'zod';

export function applyZodErrors<T extends FieldValues>(form: UseFormReturn<T>, error: ZodError) {
  form.clearErrors();
  error.errors.forEach(issue => {
    const path = issue.path[0];
    if (path) {
      form.setError(path as Path<T>, { message: issue.message });
    }
  });
}
