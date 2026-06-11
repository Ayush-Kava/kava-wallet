'use client';

import { ReactNode } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/ui/dropdown-menu';
import { Button } from '@/components/atoms/ui/button';

export interface DropdownButtonItem {
  id: string;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  icon?: ReactNode;
}

export interface DropdownButtonProps {
  trigger: ReactNode;
  items: DropdownButtonItem[];
  align?: 'start' | 'center' | 'end';
  className?: string;
  showSeparator?: boolean;
}

export function DropdownButton({
  trigger,
  items,
  align = 'end',
  className = '',
  showSeparator = false,
}: DropdownButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {typeof trigger === 'string' ? (
          <Button variant="ghost" className={className}>
            {trigger}
          </Button>
        ) : (
          trigger
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
        {items.map((item, index) => (
          <div key={item.id}>
            <DropdownMenuItem
              onClick={item.onClick}
              className={
                item.variant === 'destructive' ? 'text-destructive focus:bg-destructive/10' : ''
              }
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </DropdownMenuItem>
            {showSeparator && index < items.length - 1 && <DropdownMenuSeparator />}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
