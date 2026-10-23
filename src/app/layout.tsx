import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { MarketplaceProvider } from '@/lib/store';
import { NotificationProvider } from '@/features/notifications/notificationContext';
import AppHeader from '@/components/AppHeader';

export const metadata: Metadata = {
  title: 'LocalNest | Hyperlocal Society Services & Recurring Marketplace',
  description:
    'Book, pay, and subscribe to trusted neighborhood laundry, home cleaning, daily tiffin, car wash, and repairs from verified providers in your residential society.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0d9488',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NotificationProvider>
          <MarketplaceProvider>
            <AppHeader />
            {children}
          </MarketplaceProvider>
        </NotificationProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
