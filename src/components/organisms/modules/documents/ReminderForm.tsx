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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/molecules/common/DatePicker';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import type {
  CreateDocumentReminderData,
  DocumentReminder,
  UpdateDocumentReminderData,
} from '@/types/document-types';

const reminderFormSchema = z.object({
  reminder_type: z.enum(['policy_expiry', 'statement_due', 'document_validity']),
  reminder_date: z.string().min(1, 'Date is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  completed: z.boolean().optional(),
});

type ReminderFormValues = z.infer<typeof reminderFormSchema>;

interface ReminderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  onSubmit: (data: CreateDocumentReminderData | UpdateDocumentReminderData) => Promise<void>;
  isSubmitting?: boolean;
  mode?: 'create' | 'edit';
  initialData?: DocumentReminder;
}

const getDefaultValues = (
  mode: 'create' | 'edit',
  initialData?: DocumentReminder,
): ReminderFormValues => {
  if (mode === 'edit' && initialData) {
    return {
      reminder_type: initialData.reminder_type as ReminderFormValues['reminder_type'],
      reminder_date: initialData.reminder_date,
      title: initialData.title,
      description: initialData.description || '',
      completed: initialData.completed,
    };
  }

  return {
    reminder_type: 'document_validity',
    reminder_date: '',
    title: '',
    description: '',
    completed: false,
  };
};

interface ReminderFormBodyProps {
  documentId: string;
  onSubmit: (data: CreateDocumentReminderData | UpdateDocumentReminderData) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
  initialData?: DocumentReminder;
}

function ReminderFormBody({
  documentId,
  onSubmit,
  onOpenChange,
  isSubmitting,
  mode,
  initialData,
}: ReminderFormBodyProps) {
  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: getDefaultValues(mode, initialData),
  });

  const handleSubmit = async (values: ReminderFormValues) => {
    if (mode === 'edit' && initialData) {
      await onSubmit({
        id: initialData.id,
        document_id: documentId,
        ...values,
      });
    } else {
      await onSubmit({
        document_id: documentId,
        reminder_type: values.reminder_type,
        reminder_date: values.reminder_date,
        title: values.title,
        description: values.description,
      });
    }

    onOpenChange(false);
  };

  const isEdit = mode === 'edit';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="reminder_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reminder Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="policy_expiry">Policy Expiry</SelectItem>
                  <SelectItem value="statement_due">Statement Due</SelectItem>
                  <SelectItem value="document_validity">Document Validity</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reminder_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reminder Date</FormLabel>
              <FormControl>
                <DatePicker value={field.value} onChange={field.onChange} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Renew insurance policy"
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add more details about this reminder"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isEdit && (
          <FormField
            control={form.control}
            name="completed"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormLabel className="cursor-pointer font-normal">Mark as complete</FormLabel>
              </FormItem>
            )}
          />
        )}

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
            {isSubmitting
              ? isEdit
                ? 'Saving...'
                : 'Creating...'
              : isEdit
                ? 'Save Changes'
                : 'Create Reminder'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function ReminderForm({
  open,
  onOpenChange,
  documentId,
  onSubmit,
  isSubmitting = false,
  mode = 'create',
  initialData,
}: ReminderFormProps) {
  const isEdit = mode === 'edit';
  const formKey = isEdit && initialData ? initialData.id : 'create';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Reminder' : 'Create Reminder'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update this document reminder' : 'Set a reminder for this document'}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <ReminderFormBody
            key={formKey}
            documentId={documentId}
            onSubmit={onSubmit}
            onOpenChange={onOpenChange}
            isSubmitting={isSubmitting}
            mode={mode}
            initialData={initialData}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
