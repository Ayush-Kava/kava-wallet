import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Document, UpdateDocumentData } from '@/types/document-types';
import { useEffect } from 'react';

const documentEditSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  description: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
});

interface DocumentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document;
  onSubmit: (data: UpdateDocumentData) => Promise<void>;
  isSubmitting?: boolean;
}

export function DocumentEditDialog({
  open,
  onOpenChange,
  document,
  onSubmit,
  isSubmitting = false,
}: DocumentEditDialogProps) {
  const form = useForm<z.infer<typeof documentEditSchema>>({
    resolver: zodResolver(documentEditSchema),
    defaultValues: {
      name: document.name,
      description: document.description || '',
      tags: document.tags?.join(', ') || '',
      notes: document.notes || '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: document.name,
        description: document.description || '',
        tags: document.tags?.join(', ') || '',
        notes: document.notes || '',
      });
    }
  }, [open, document, form]);

  const handleSubmit = async (values: z.infer<typeof documentEditSchema>) => {
    await onSubmit({
      id: document.id,
      name: values.name,
      description: values.description || undefined,
      tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      notes: values.notes || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
          <DialogDescription>Update document metadata</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[72px] resize-none"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., important, insurance, 2026"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>Separate tags with commas</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[72px] resize-none"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
