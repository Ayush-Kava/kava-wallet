import Link from 'next/link';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

type AppLinkProps = ComponentPropsWithoutRef<typeof Link>;

/**
 * App-internal navigation link. Prefetch is off by default to avoid background
 * RSC fetches on list pages and in the sidebar. Pass prefetch={true} when needed.
 */
export const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(function AppLink(
  { prefetch = false, ...props },
  ref,
) {
  return <Link ref={ref} prefetch={prefetch} {...props} />;
});
