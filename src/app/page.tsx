'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
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
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

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
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
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
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
              <Sparkles size={16} />
              Smart Money Management
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              Take Control of Your
              <span className="block gradient-text">Financial Future</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
              Track expenses, manage budgets, and grow your wealth with our intuitive 
              money management platform. Simple, secure, and completely free.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in" style={{ animationDelay: '300ms' }}>
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
            <div className="flex flex-wrap justify-center gap-8 lg:gap-16 animate-fade-in" style={{ animationDelay: '400ms' }}>
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-3xl lg:text-4xl font-display font-bold gradient-text">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-display font-bold mb-4">
              Everything You Need to
              <span className="gradient-text"> Master Your Money</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to give you complete control over your finances.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-card shadow-card hover:shadow-lg transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow">
                  <feature.icon className="text-primary-foreground" size={28} />
                </div>
                <h3 className="text-xl font-display font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center p-8 lg:p-16 rounded-3xl gradient-dark relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-64 h-64 bg-primary rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent rounded-full blur-3xl" />
            </div>
            
            <div className="relative z-10 text-primary-foreground">
              <h2 className="text-3xl lg:text-4xl font-display font-bold mb-4">
                Ready to Transform Your Finances?
              </h2>
              <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
                Join thousands of users who have taken control of their money with KavaFlow.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" variant="default" className="shadow-lg" asChild>
                  <Link href="/auth">
                    Create Free Account <ArrowRight size={20} />
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-center justify-center gap-6 mt-8 text-sm opacity-70">
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
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground text-center">
              © 2024 KavaFlow. A product of <span className="font-semibold">Kava Group of Companies</span>
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
