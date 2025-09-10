import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Signature QuoteCrawler',
  description: 'Quote builder with Signature Solar price cache',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
          {children}
        </div>
      </body>
    </html>
  );
}