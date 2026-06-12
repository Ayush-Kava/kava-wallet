import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSeparator,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CreateDocumentData } from '@/types/document-types';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { documentUploadUtils } from '@/lib/document-upload-utils';
import { inferDocumentFileType, resolveFileExtension, resolveMimeType } from '@/lib/document-file-utils';
import { useToast } from '@/hooks/useToast';

const documentFormSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  description: z.string().optional(),
  file_type: z.enum(['pdf', 'image', 'scan', 'receipt']),
  tags: z.string().optional(),
  notes: z.string().optional(),
});

interface DocumentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateDocumentData) => Promise<void>;
  isSubmitting?: boolean;
}

export function DocumentUploadForm({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: DocumentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<z.infer<typeof documentFormSchema>>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      name: '',
      description: '',
      file_type: 'pdf',
      tags: '',
      notes: '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const mimeType = resolveMimeType(selectedFile.name, selectedFile.type);
      const fileExtension = resolveFileExtension(selectedFile.name, mimeType);
      form.setValue('file_type', inferDocumentFileType(mimeType, fileExtension));
      if (!form.getValues('name')) {
        form.setValue('name', selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (values: z.infer<typeof documentFormSchema>) => {
    if (!file || !user) {
      form.setError('file_type', { message: 'Please select a file' });
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const upload = await documentUploadUtils.uploadFile(user.id, file);

      await onSubmit({
        ...values,
        file_type: upload.file_type,
        file_url: upload.publicUrl,
        file_extension: upload.file_extension,
        mime_type: upload.mime_type,
        file_size: file.size,
        tags: values.tags ? values.tags.split(',').map(t => t.trim()) : [],
      });

      form.reset();
      setFile(null);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error uploading file',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,44rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[520px]">
        <DialogHeader className="shrink-0 space-y-1 border-b-0 px-6 py-4 pb-4 shadow-none">
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>Add a new document to your vault</DialogDescription>
        </DialogHeader>
        <DialogSeparator />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <FormField
              control={form.control}
              name="file_type"
              render={() => (
                <FormItem>
                  <FormLabel>Select File</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                      disabled={uploading || isSubmitting}
                    />
                  </FormControl>
                  {file && (
                    <FormDescription>
                      Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Insurance Policy 2026"
                      {...field}
                      disabled={uploading || isSubmitting}
                    />
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
                      placeholder="Add additional details about this document"
                      className="min-h-[72px] resize-none"
                      {...field}
                      disabled={uploading || isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="file_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={uploading || isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent
                      side="bottom"
                      align="start"
                      position="popper"
                      sideOffset={4}
                      collisionPadding={16}
                    >
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="scan">Scan</SelectItem>
                      <SelectItem value="receipt">Receipt</SelectItem>
                    </SelectContent>
                  </Select>
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
                      disabled={uploading || isSubmitting}
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
                      placeholder="Add any notes about this document"
                      className="min-h-[72px] resize-none"
                      {...field}
                      disabled={uploading || isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>

            <DialogSeparator />
            <div className="flex shrink-0 justify-end gap-3 bg-background px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  form.reset();
                  setFile(null);
                }}
                disabled={uploading || isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={uploading || isSubmitting}>
                {uploading ? 'Uploading...' : isSubmitting ? 'Saving...' : 'Upload Document'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
