'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/branding/Logo';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Shield,
  TrendingUp,
  PieChart,
  Wallet,
  Target,
  Zap,
  Check,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/app/dashboard');
    }
  }, [loading, user, router]);

  const features = [
    {
      icon: Wallet,
      title: 'Multiple Accounts',
      description: 'Track cash, bank accounts, credit cards, and digital wallets in one place.',
    },
    {
      icon: TrendingUp,
      title: 'Income & Expense Tracking',
      description: 'Log every transaction with categories for complete visibility.',
    },
    {
      icon: PieChart,
      title: 'Visual Analytics',
      description: 'Beautiful charts showing where your money goes each month.',
    },
    {
      icon: Target,
      title: 'Budget Goals',
      description: 'Set spending limits and get alerts before you overspend.',
    },
    {
      icon: Shield,
      title: 'Bank-Level Security',
      description: 'Your data is encrypted and completely private to you.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Add transactions in seconds with our intuitive interface.',
    },
  ];

  const stats = [
    { value: '100%', label: 'Data Privacy' },
    { value: 'Real-time', label: 'Balance Updates' },
    { value: 'Free', label: 'To Get Started' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="glass fixed left-0 right-0 top-0 z-50 border-b border-border/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth">
                Get Started <ArrowRight size={18} />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pb-20 pt-32 lg:pb-32 lg:pt-40">
        {/* Background Effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-pulse-slow absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          <div
            className="animate-pulse-slow absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/20 blur-3xl"
            style={{ animationDelay: '2s' }}
          />
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex animate-fade-in items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles size={16} />
              Smart Money Management
            </div>

            <h1
              className="font-display mb-6 animate-fade-in text-4xl font-bold sm:text-5xl lg:text-6xl"
              style={{ animationDelay: '100ms' }}
            >
              Take Control of Your
              <span className="gradient-text block">Financial Future</span>
            </h1>

            <p
              className="mx-auto mb-8 max-w-2xl animate-fade-in text-lg text-muted-foreground lg:text-xl"
              style={{ animationDelay: '200ms' }}
            >
              Track expenses, manage budgets, and grow your wealth with our intuitive money
              management platform. Simple, secure, and completely free.
            </p>

            <div
              className="mb-12 flex animate-fade-in flex-col items-center justify-center gap-4 sm:flex-row"
              style={{ animationDelay: '300ms' }}
            >
              <Button size="lg" variant="default" asChild>
                <Link href="/auth">
                  Start Managing Money <ArrowRight size={20} />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/auth">View Demo</Link>
              </Button>
            </div>

            {/* Stats */}
            <div
              className="flex animate-fade-in flex-wrap justify-center gap-8 lg:gap-16"
              style={{ animationDelay: '400ms' }}
            >
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="font-display gradient-text text-3xl font-bold lg:text-4xl">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="font-display mb-4 text-3xl font-bold lg:text-4xl">
              Everything You Need to
              <span className="gradient-text"> Master Your Money</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Powerful features designed to give you complete control over your finances.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group rounded-2xl bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="gradient-primary mb-4 flex h-14 w-14 items-center justify-center rounded-xl transition-shadow group-hover:shadow-glow">
                  <feature.icon className="text-primary-foreground" size={28} />
                </div>
                <h3 className="font-display mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="gradient-dark relative mx-auto max-w-4xl overflow-hidden rounded-3xl p-8 text-center lg:p-16">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-primary blur-3xl" />
              <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-accent blur-3xl" />
            </div>

            <div className="relative z-10 text-primary-foreground">
              <h2 className="font-display mb-4 text-3xl font-bold lg:text-4xl">
                Ready to Transform Your Finances?
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-lg opacity-80">
                Join thousands of users who have taken control of their money with KavaFlow.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" variant="default" className="shadow-lg" asChild>
                  <Link href="/auth">
                    Create Free Account <ArrowRight size={20} />
                  </Link>
                </Button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-6 text-sm opacity-70">
                <span className="flex items-center gap-2">
                  <Check size={16} /> Free forever
                </span>
                <span className="flex items-center gap-2">
                  <Check size={16} /> No credit card
                </span>
                <span className="flex items-center gap-2">
                  <Check size={16} /> Cancel anytime
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <Logo size="sm" />
            <p className="text-center text-sm text-muted-foreground">
              © 2024 KavaFlow. A product of{' '}
              <span className="font-semibold">Kava Group of Companies</span>
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="transition-colors hover:text-foreground">
                Privacy
              </a>
              <a href="#" className="transition-colors hover:text-foreground">
                Terms
              </a>
              <a href="#" className="transition-colors hover:text-foreground">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
