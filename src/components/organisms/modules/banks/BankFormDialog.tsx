'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
import type { Bank } from '@/types/account-types';
import type { CreateBankData } from '@/types/bank-types';
import { Loader2 } from 'lucide-react';

const bankFormSchema = z.object({
  name: z.string().min(1, 'Bank name is required').max(100),
  ifsc_prefix: z.string().max(4).optional(),
  is_active: z.boolean().optional(),
});

type BankFormValues = z.infer<typeof bankFormSchema>;

interface BankFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initialBank?: Bank | null;
  onSubmit: (data: CreateBankData & { is_active?: boolean }) => Promise<void>;
  isSubmitting?: boolean;
}

function buildDefaultValues(initialBank?: Bank | null): BankFormValues {
  return {
    name: initialBank?.name ?? '',
    ifsc_prefix: initialBank?.ifsc_prefix ?? '',
    is_active: initialBank?.is_active ?? true,
  };
}

function BankFormBody({
  mode,
  initialBank,
  onSubmit,
  onClose,
  isSubmitting,
}: {
  mode: 'create' | 'edit';
  initialBank?: Bank | null;
  onSubmit: (data: CreateBankData & { is_active?: boolean }) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
}) {
  const form = useForm<BankFormValues>({
    resolver: zodResolver(bankFormSchema),
    defaultValues: buildDefaultValues(initialBank),
  });

  useEffect(() => {
    form.reset(buildDefaultValues(initialBank));
  }, [initialBank, form]);

  const handleSubmit = async (values: BankFormValues) => {
    await onSubmit({
      name: values.name.trim(),
      ifsc_prefix: values.ifsc_prefix?.trim() || undefined,
      ...(mode === 'edit' ? { is_active: values.is_active } : {}),
    });
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank Name *</FormLabel>
              <FormControl>
                <Input placeholder="HDFC Bank" maxLength={100} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ifsc_prefix"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IFSC Prefix (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="HDFC"
                  maxLength={4}
                  {...field}
                  onChange={e => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormDescription>First 4 characters of the bank&apos;s IFSC code.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {mode === 'edit' && (
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Inactive banks are hidden from account setup.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : mode === 'edit' ? (
              'Save Changes'
            ) : (
              'Add Bank'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function BankFormDialog({
  open,
  onOpenChange,
  mode,
  initialBank,
  onSubmit,
  isSubmitting = false,
}: BankFormDialogProps) {
  const [formSession, setFormSession] = useState(0);

  const handleOpenChange = (next: boolean) => {
    if (next) setFormSession(session => session + 1);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {mode === 'edit' ? 'Edit Bank' : 'Add Bank'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Update bank details or deactivate it for new accounts.'
              : 'Add a bank that users can select when creating accounts.'}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <BankFormBody
            key={`${initialBank?.id ?? 'new'}-${formSession}`}
            mode={mode}
            initialBank={initialBank}
            onSubmit={onSubmit}
            onClose={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
