import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/organisms/providers/Providers';
import { NotificationToaster } from '@/components/molecules/common/Notification';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Kava Wallet - Smart Money Management',
  description:
    'Track expenses, manage budgets, and grow your wealth with our intuitive money management platform.',
  authors: [{ name: 'Kava Group of Companies' }],
  openGraph: {
    title: 'Kava Wallet - Smart Money Management',
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
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className={`${inter.className} font-sans`}>
        <Providers>
          {children}
          <NotificationToaster />
        </Providers>
      </body>
    </html>
  );
}
