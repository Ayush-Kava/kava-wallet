import { ReactNode } from 'react';
import { Button } from '@/components/atoms/Button';
import { RiAddLine, RiArrowLeftLine } from '@remixicon/react';
import { cn } from '@/lib/utils';

/** Shared styles for every button/link in the page header action slot */
const headerActionsClass =
  'flex shrink-0 items-center gap-1.5 [&_button]:!h-8 [&_button]:!px-3 [&_button]:!text-xs [&_button]:gap-1.5 [&_a]:inline-flex [&_a]:!h-8 [&_a]:items-center [&_a]:justify-center [&_a]:gap-1.5 [&_a]:!px-3 [&_a]:!text-xs';

interface PageHeaderWithActionProps {
  title: string;
  description?: string;
  onAdd?: () => void;
  addButtonText?: string;
  className?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  customActionButton?: ReactNode;
}

export function PageHeaderWithAction({
  title,
  description,
  onAdd,
  addButtonText = 'New',
  className,
  showBackButton = false,
  onBackClick,
  customActionButton,
}: PageHeaderWithActionProps) {
  return (
    <div className={cn('flex min-h-11 items-center justify-between gap-3 py-2', className)}>
      <div className="flex min-w-0 items-center gap-2">
        {showBackButton && onBackClick ? (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBackClick}>
            <RiArrowLeftLine className="h-3.5 w-3.5" />
          </Button>
        ) : null}
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-semibold leading-snug text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="mt-0.5 truncate text-[13px] leading-snug text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {customActionButton ? (
        <div className={headerActionsClass}>{customActionButton}</div>
      ) : onAdd ? (
        <div className={headerActionsClass}>
          <Button onClick={onAdd} size="sm" className="shrink-0">
            <RiAddLine className="h-3.5 w-3.5" />
            {addButtonText}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
