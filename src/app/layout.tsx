import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/contexts/app-context';
import { AccountProvider } from '@/contexts/account-context';
import { Toaster } from "@/components/ui/toaster";
import { use } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('pennywise-theme') || 'system';
                  var root = document.documentElement;
                  
                  // Clear any existing theme classes
                  root.classList.remove('light', 'dark');
                  
                  console.log('Theme script running, stored theme:', theme);
                  
                  if (theme === 'system') {
                    // Check if matchMedia is supported
                    if (typeof window.matchMedia === 'function') {
                      var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                      var isDark = mediaQuery.matches;
                      console.log('System theme detected:', isDark ? 'dark' : 'light');
                      console.log('matchMedia supported:', true);
                      root.classList.add(isDark ? 'dark' : 'light');
                    } else {
                      console.log('matchMedia not supported, using light theme');
                      root.classList.add('light');
                    }
                  } else {
                    console.log('Using stored theme:', theme);
                    root.classList.add(theme);
                  }
                  
                  console.log('Final HTML classes:', root.className);
                } catch (e) {
                  console.error('Theme script error:', e);
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="hsl(220 22% 97%)" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="hsl(210 29% 15%)" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PennyWise" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AccountProvider>
            <AppProvider>
              <TooltipProvider>
                {children}
                <Toaster />
              </TooltipProvider>
            </AppProvider>
          </AccountProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
