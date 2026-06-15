import { cn } from '@/lib/utils';
import { isCategoryEmoji } from '@/lib/category-display';
import { AppleEmoji } from '@/components/molecules/categories/AppleEmoji';

interface CategoryIconProps {
  icon: string;
  color: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { dot: 'h-2.5 w-2.5', emoji: 18 },
  md: { dot: 'h-3 w-3', emoji: 22 },
  lg: { dot: 'h-3.5 w-3.5', emoji: 28 },
};

export function CategoryIcon({
  icon,
  color,
  name,
  size = 'md',
  className,
}: CategoryIconProps) {
  const sizes = sizeMap[size];

  if (isCategoryEmoji(icon)) {
    return (
      <span
        className={cn('inline-flex shrink-0 items-center justify-center leading-none', className)}
        title={name}
        aria-hidden={!name}
      >
        <AppleEmoji emoji={icon} size={sizes.emoji} alt={name} />
      </span>
    );
  }

  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center', className)}
      title={name}
      aria-hidden={!name}
    >
      <span
        className={cn('rounded-full ring-1 ring-border/40', sizes.dot)}
        style={{ backgroundColor: color }}
      />
    </span>
  );
}
