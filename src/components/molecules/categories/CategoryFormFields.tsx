'use client';

import type { Control } from 'react-hook-form';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import {
  CATEGORY_EMOJI_SUGGESTIONS,
  type CategoryDisplayMode,
} from '@/lib/category-display';
import { Palette, Smile } from 'lucide-react';
import { AppleEmoji } from '@/components/molecules/categories/AppleEmoji';

export type CategoryFormValues = {
  name: string;
  displayMode: CategoryDisplayMode;
  color: string;
  emoji: string;
};

interface CategoryFormFieldsProps {
  control: Control<CategoryFormValues>;
  disabled?: boolean;
}

function CategoryFormPreview() {
  const form = useFormContext<CategoryFormValues>();
  const name = form.watch('name');
  const displayMode = form.watch('displayMode');
  const color = form.watch('color');
  const emoji = form.watch('emoji');

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Preview
      </p>
      <div className="flex items-center gap-3">
        {displayMode === 'color' ? (
          <span className="inline-flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full ring-1 ring-border/40"
              style={{ backgroundColor: color }}
            />
            <span className="font-medium">{name.trim() || 'Category name'}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <AppleEmoji emoji={emoji || '❓'} size={22} />
            <span className="font-medium">{name.trim() || 'Category name'}</span>
          </span>
        )}
      </div>
    </div>
  );
}

export function CategoryFormFields({ control, disabled = false }: CategoryFormFieldsProps) {
  const displayMode = useFormContext<CategoryFormValues>().watch('displayMode');

  return (
    <div className="space-y-5">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category name</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Groceries, Rent, Side hustle"
                disabled={disabled}
                autoFocus
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="displayMode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Display style</FormLabel>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-1">
              <button
                type="button"
                disabled={disabled}
                onClick={() => field.onChange('color')}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  field.value === 'color'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                <Palette className="h-4 w-4" />
                Color dot
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => field.onChange('emoji')}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  field.value === 'emoji'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                <Smile className="h-4 w-4" />
                Emoji
              </button>
            </div>
          </FormItem>
        )}
      />

      {displayMode === 'color' ? (
        <FormField
          control={control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pick a color</FormLabel>
              <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
                <label className="relative cursor-pointer">
                  <input
                    type="color"
                    value={field.value}
                    onChange={e => field.onChange(e.target.value)}
                    disabled={disabled}
                    className="sr-only"
                  />
                  <span
                    className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border shadow-inner transition-transform hover:scale-105"
                    style={{ backgroundColor: field.value }}
                  />
                </label>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium">Color wheel</p>
                  <p className="text-xs text-muted-foreground">
                    Tap the circle to open your browser&apos;s color picker and choose any shade.
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded-full border border-border"
                      style={{ backgroundColor: field.value }}
                    />
                    <Input
                      value={field.value.toUpperCase()}
                      onChange={e => {
                        const v = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) field.onChange(v);
                      }}
                      disabled={disabled}
                      className="h-8 font-mono text-xs uppercase"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <FormField
          control={control}
          name="emoji"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pick an emoji</FormLabel>
              <div className="flex items-center gap-3">
                <AppleEmoji emoji={field.value || '❓'} size={36} />
                <FormControl>
                  <Input
                    value={field.value}
                    onChange={e => {
                      const chars = [...e.target.value];
                      field.onChange(chars.slice(-1).join('') || chars[0] || '');
                    }}
                    placeholder="Type or paste an emoji"
                    disabled={disabled}
                    className="flex-1"
                    maxLength={4}
                  />
                </FormControl>
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_EMOJI_SUGGESTIONS.map(item => (
                  <button
                    key={item}
                    type="button"
                    disabled={disabled}
                    onClick={() => field.onChange(item)}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg border border-border transition-all hover:scale-105 hover:bg-muted',
                      field.value === item && 'border-primary bg-primary/10 ring-2 ring-primary/30',
                    )}
                  >
                    <AppleEmoji emoji={item} size={24} />
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <CategoryFormPreview />
    </div>
  );
}
