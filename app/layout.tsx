import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Signature QuoteCrawler',
  description: 'Quote builder with Signature Solar price cache',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground min-h-screen">
        <header className="border-b border-border">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/" className="font-extrabold tracking-tight" style={{ fontSize: 18 }}>Signature QuoteCrawler</a>
            <nav className="flex items-center gap-6 text-sm">
              <a href="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</a>
              <a href="/products" className="text-muted-foreground hover:text-foreground">Products</a>
              <a href="/quotes/new" className="text-muted-foreground hover:text-foreground">New Quote</a>
            </nav>
          </div>
        </header>
        <main className="container mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}