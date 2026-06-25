'use client';

import { forwardRef } from 'react';
import { AppLink } from '@/components/atoms/AppLink';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  className?: string;
  activeClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, activeClassName, href, children, ...props }, ref) => {
    const pathname = usePathname();
    const isActive = pathname === href || pathname?.startsWith(href + '/');

    return (
      <AppLink ref={ref} href={href} className={cn(className, isActive && activeClassName)} {...props}>
        {children}
      </AppLink>
    );
  },
);

NavLink.displayName = 'NavLink';

export { NavLink };
