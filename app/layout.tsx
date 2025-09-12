import type { Metadata, Viewport } from 'next';
import './globals.css';
import ProfileDropdown from '@/components/ProfileDropdown';
import NavLinks from '@/components/NavLinks';
import { SessionProvider } from 'next-auth/react';

export const metadata: Metadata = {
  title: 'Signature QuoteCrawler',
  description: 'Quote builder with Signature Solar price cache',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground min-h-screen">
        <SessionProvider>
          <header className="border-b border-border">
            <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
              <a href="/" className="font-extrabold tracking-tight text-sm md:text-lg">Signature QuoteCrawler</a>
              <div className="flex items-center gap-3 md:gap-6">
                <NavLinks />
                <ProfileDropdown />
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 md:px-6 py-4 md:py-8">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}