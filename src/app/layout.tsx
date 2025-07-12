import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/contexts/app-context';
import { Toaster } from "@/components/ui/toaster";
import { use } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';

export const metadata: Metadata = {
  title: 'PennyWise - Income & Expense Tracker',
  description: 'Track your daily income and expenses with PennyWise.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function RootLayout({
  children,
  searchParams,
}: RootLayoutProps) {
  // If searchParams is provided by Next.js, unwrap it.
  // Next.js ensures that if searchParams is passed, it's the special object type expected by use().
  if (searchParams) {
    use(searchParams);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="hsl(220 40% 98%)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PennyWise" />
      </head>
      <body className="font-body antialiased">
        <AppProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </AppProvider>
      </body>
    </html>
  );
}
