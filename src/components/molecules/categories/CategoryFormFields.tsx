'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  CATEGORY_EMOJI_SUGGESTIONS,
  type CategoryDisplayMode,
} from '@/lib/category-display';
import { Palette, Smile } from 'lucide-react';
import { AppleEmoji } from '@/components/molecules/categories/AppleEmoji';

interface CategoryFormFieldsProps {
  name: string;
  onNameChange: (value: string) => void;
  displayMode: CategoryDisplayMode;
  onDisplayModeChange: (mode: CategoryDisplayMode) => void;
  color: string;
  onColorChange: (value: string) => void;
  emoji: string;
  onEmojiChange: (value: string) => void;
  disabled?: boolean;
}

export function CategoryFormFields({
  name,
  onNameChange,
  displayMode,
  onDisplayModeChange,
  color,
  onColorChange,
  emoji,
  onEmojiChange,
  disabled = false,
}: CategoryFormFieldsProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="category-name">Category name</Label>
        <Input
          id="category-name"
          placeholder="e.g. Groceries, Rent, Side hustle"
          value={name}
          onChange={e => onNameChange(e.target.value)}
          disabled={disabled}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label>Display style</Label>
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-1">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onDisplayModeChange('color')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              displayMode === 'color'
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
            onClick={() => onDisplayModeChange('emoji')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              displayMode === 'emoji'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <Smile className="h-4 w-4" />
            Emoji
          </button>
        </div>
      </div>

      {displayMode === 'color' ? (
        <div className="space-y-3">
          <Label>Pick a color</Label>
          <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
            <label className="relative cursor-pointer">
              <input
                type="color"
                value={color}
                onChange={e => onColorChange(e.target.value)}
                disabled={disabled}
                className="sr-only"
              />
              <span
                className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border shadow-inner transition-transform hover:scale-105"
                style={{ backgroundColor: color }}
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
                  style={{ backgroundColor: color }}
                />
                <Input
                  value={color.toUpperCase()}
                  onChange={e => {
                    const v = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onColorChange(v);
                  }}
                  disabled={disabled}
                  className="h-8 font-mono text-xs uppercase"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Label>Pick an emoji</Label>
          <div className="flex items-center gap-3">
            <AppleEmoji emoji={emoji || '❓'} size={36} />
            <Input
              value={emoji}
              onChange={e => {
                const chars = [...e.target.value];
                onEmojiChange(chars.slice(-1).join('') || chars[0] || '');
              }}
              placeholder="Type or paste an emoji"
              disabled={disabled}
              className="flex-1"
              maxLength={4}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_EMOJI_SUGGESTIONS.map(item => (
              <button
                key={item}
                type="button"
                disabled={disabled}
                onClick={() => onEmojiChange(item)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg border border-border transition-all hover:scale-105 hover:bg-muted',
                  emoji === item && 'border-primary bg-primary/10 ring-2 ring-primary/30',
                )}
              >
                <AppleEmoji emoji={item} size={24} />
              </button>
            ))}
          </div>
        </div>
      )}

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
    </div>
  );
}
