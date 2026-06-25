'use client';

import { type ReactNode, useMemo } from 'react';
import { AppLink } from '@/components/atoms/AppLink';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/constants/routes';
import { useUiStore } from '@/store/ui/use-ui-store';
import { cn } from '@/lib/utils';
import Logo from '@/components/branding/Logo';
import { PageHeaderWithAction } from '@/components/molecules/common/PageHeaderWithAction';
import { Avatar, AvatarFallback } from '@/components/atoms/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  ArrowUpDown,
  Wallet,
  PieChart,
  Target,
  Settings,
  CreditCard,
  Landmark,
  LineChart,
  FileText,
  LogOut,
  Repeat,
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  PiggyBank,
  ChevronsUpDown,
  Palette,
  Plus,
  Tags,
  Building2,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}

type NavItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: ROUTES.dashboard },
      { icon: PieChart, label: 'Analytics', path: ROUTES.analytics },
    ],
  },
  {
    label: 'Money',
    items: [
      { icon: Wallet, label: 'Accounts', path: ROUTES.accounts },
      { icon: ArrowUpDown, label: 'Transactions', path: ROUTES.transactions },
      { icon: CreditCard, label: 'Credit Cards', path: ROUTES.creditCards },
    ],
  },
  {
    label: 'Planning',
    items: [
      { icon: PiggyBank, label: 'Budgets', path: ROUTES.budgets },
      { icon: Target, label: 'Goals', path: ROUTES.goals },
      { icon: Tags, label: 'Categories', path: ROUTES.categories },
    ],
  },
  {
    label: 'Track',
    items: [
      { icon: Landmark, label: 'Loans', path: ROUTES.loans },
      { icon: LineChart, label: 'Investments', path: ROUTES.investments },
      { icon: Repeat, label: 'Recurring', path: ROUTES.recurring },
    ],
  },
  {
    label: 'Vault',
    items: [{ icon: FileText, label: 'Documents', path: ROUTES.documents }],
  },
];

const NavLink = ({
  href,
  icon: Icon,
  label,
  isActive,
  onClick,
  className,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  className?: string;
}) => (
  <AppLink
    href={href}
    onClick={onClick}
    className={cn(
      'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium leading-none transition-colors',
      className,
      isActive
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
    )}
  >
    <Icon className="h-4 w-4 shrink-0" />
    <span className="truncate">{label}</span>
  </AppLink>
);

const DashboardLayout = ({ children, title, description, actions }: DashboardLayoutProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { setTheme } = useTheme();
  const { mobileMenuOpen, setMobileMenuOpen, openTransactionDialog } = useUiStore();

  const sidebarNavGroups = useMemo((): NavGroup[] => {
    const groups: NavGroup[] = [...navGroups];
    if (user?.role === 'admin') {
      groups.push({
        label: 'Admin',
        items: [{ icon: Building2, label: 'Banks', path: ROUTES.adminBanks }],
      });
    }
    return groups;
  }, [user?.role]);

  const handleSignOut = async () => {
    await signOut();
    router.push(ROUTES.home);
  };

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center px-4">
        <Logo size="sm" />
      </div>

      <Separator />

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {sidebarNavGroups.map(group => (
          <div key={group.label}>
            <p className="mb-1.5 px-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <div key={item.path} className="flex items-center gap-0.5">
                  <NavLink
                    href={item.path}
                    icon={item.icon}
                    label={item.label}
                    isActive={pathname === item.path || pathname.startsWith(`${item.path}/`)}
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-w-0 flex-1"
                  />
                  {item.path === ROUTES.transactions && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
                      aria-label="Add transaction"
                      onClick={() => {
                        openTransactionDialog({ mode: 'expense' });
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <Separator />

      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 py-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar className="h-8 w-8 rounded-md">
                <AvatarFallback className="rounded-md bg-primary/10 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium leading-tight text-foreground">
                  {user?.full_name || 'User'}
                </p>
                <p className="mt-0.5 truncate text-xs leading-tight text-muted-foreground">
                  {user?.email}
                </p>
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-tight">{user?.full_name || 'User'}</p>
                <p className="text-xs leading-tight text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(ROUTES.settings)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Palette className="mr-2 h-4 w-4" />
                Theme
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
        <Logo size="sm" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-border bg-[hsl(var(--sidebar-background))] transition-transform duration-200 lg:translate-x-0',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
      </aside>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="lg:pl-[240px]">
        <header className="sticky top-0 z-20 hidden border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:block">
          <div className="px-5">
            <PageHeaderWithAction
              title={title}
              description={description}
              customActionButton={actions}
            />
          </div>
        </header>

        <main className="pt-14 lg:pt-0">
          <div className="border-b border-border px-4 py-3 lg:hidden">
            <PageHeaderWithAction
              title={title}
              description={description}
              customActionButton={actions}
            />
          </div>
          <div className="px-5 py-5">
            <div className="space-y-5">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
