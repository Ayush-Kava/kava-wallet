'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getAppleEmojiUrl } from '@/lib/apple-emoji';

interface AppleEmojiProps {
  emoji: string;
  size?: number;
  className?: string;
  alt?: string;
}

export function AppleEmoji({ emoji, size = 28, className, alt }: AppleEmojiProps) {
  const [useFallback, setUseFallback] = useState(false);

  if (!emoji || useFallback) {
    return (
      <span className={cn('leading-none', className)} style={{ fontSize: size * 0.9 }} aria-hidden>
        {emoji}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Apple emoji CDN assets
    <img
      src={getAppleEmojiUrl(emoji)}
      alt={alt || emoji}
      width={size}
      height={size}
      className={cn('inline-block object-contain', className)}
      onError={() => setUseFallback(true)}
      draggable={false}
    />
  );
}
