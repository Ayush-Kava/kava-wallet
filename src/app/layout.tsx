
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'KavaFlow - Smart Money Management',
  description:
    'Track expenses, manage budgets, and grow your wealth with our intuitive money management platform.',
  authors: [{ name: 'Kava Group of Companies' }],
  openGraph: {
    title: 'KavaFlow - Smart Money Management',
    description:
      'Track expenses, manage budgets, and grow your wealth with our intuitive money management platform.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
          <Sonner />
        </Providers>
      </body>
    </html>
  );
}
