'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/branding/Logo';
import { PageHeaderWithAction } from '@/components/molecules/common/PageHeaderWithAction';
import { Avatar, AvatarFallback } from '@/components/atoms/ui/avatar';
import {
  DropdownButton,
  type DropdownButtonItem,
} from '@/components/atoms/DropdownButton';
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
  Users,
  FileText,
  LogOut,
  Repeat,
  Menu,
  X,
  ChevronRight,
  User,
  MoreVertical,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ArrowUpDown, label: 'Transactions', path: '/transactions' },
  { icon: Wallet, label: 'Accounts', path: '/accounts' },
  { icon: CreditCard, label: 'Credit Cards', path: '/credit-cards' },
  { icon: Landmark, label: 'Loans & EMIs', path: '/loans' },
  { icon: LineChart, label: 'Investments', path: '/investments' },
  { icon: Target, label: 'Goals', path: '/goals' },
  { icon: Target, label: 'Budgets', path: '/budgets' },
  { icon: Users, label: 'People', path: '/people' },
  { icon: FileText, label: 'Documents', path: '/documents' },
  { icon: Repeat, label: 'Recurring', path: '/recurring' },
  { icon: PieChart, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const DashboardLayout = ({
  children,
  title,
  description,
  actions,
}: DashboardLayoutProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center justify-between px-4">
        <Logo size="sm" />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-40 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-border">
            <Logo />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive =
                pathname === item.path || pathname.startsWith(`${item.path}/`);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'gradient-primary text-primary-foreground shadow-lg shadow-primary/30'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight size={16} className="ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 p-3 rounded-xl">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="gradient-primary text-primary-foreground font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold truncate text-foreground">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
              <DropdownButton
                trigger={
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0">
                    <MoreVertical size={18} className="text-muted-foreground" />
                  </button>
                }
                items={
                  [
                    {
                      id: 'profile',
                      label: 'Profile',
                      onClick: () => router.push('/settings'),
                      icon: <User size={16} />,
                    },
                    {
                      id: 'theme-light',
                      label: 'Light',
                      onClick: () => setTheme('light'),
                      icon: <Sun size={16} />,
                    },
                    {
                      id: 'theme-dark',
                      label: 'Dark',
                      onClick: () => setTheme('dark'),
                      icon: <Moon size={16} />,
                    },
                    {
                      id: 'theme-system',
                      label: 'System',
                      onClick: () => setTheme('system'),
                      icon: <Monitor size={16} />,
                    },
                    {
                      id: 'sign-out',
                      label: 'Sign Out',
                      onClick: handleSignOut,
                      variant: 'destructive',
                      icon: <LogOut size={16} />,
                    },
                  ] as DropdownButtonItem[]
                }
                align="end"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen flex flex-col">
        <div className="sticky top-16 lg:top-0 z-30 bg-card border-b border-border shadow-sm">
          <div className="px-3 sm:px-4 lg:px-5 xl:px-6 py-3">
            <PageHeaderWithAction
              title={title}
              description={description}
              customActionButton={actions ?? undefined}
              className="items-center"
            />
          </div>
        </div>
        <div className="flex-1 px-3 sm:px-4 lg:px-5 xl:px-6 py-4">
          <div className="mx-auto max-w-[1400px] space-y-6">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
