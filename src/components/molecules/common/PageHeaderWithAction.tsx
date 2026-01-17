import { ReactNode } from 'react';
import { Button } from '@/components/atoms/Button';
import { RiAddLine, RiArrowLeftLine } from '@remixicon/react';

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
    <div
      className={`flex items-center justify-between gap-3 ${className || ''}`}
    >
      <div className="flex items-center gap-3">
        {showBackButton && onBackClick ? (
          <Button variant="ghost" onClick={onBackClick}>
            <RiArrowLeftLine />
          </Button>
        ) : null}
        <div>
          <h1 className="text-lg font-semibold leading-tight">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {customActionButton ? (
        <div>{customActionButton}</div>
      ) : onAdd ? (
        <Button onClick={onAdd} className="inline-flex items-center gap-2">
          <RiAddLine />
          {addButtonText}
        </Button>
      ) : null}
    </div>
  );
}
