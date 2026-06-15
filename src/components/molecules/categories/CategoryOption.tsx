import { cn } from '@/lib/utils';
import { CategoryIcon } from '@/components/molecules/categories/CategoryIcon';

interface CategoryOptionProps {
  name: string;
  icon: string;
  color: string;
  className?: string;
}

export function CategoryOption({ name, icon, color, className }: CategoryOptionProps) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <CategoryIcon icon={icon} color={color} name={name} size="sm" />
      <span className="truncate">{name}</span>
    </div>
  );
}
