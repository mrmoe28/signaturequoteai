import type { Metadata } from 'next';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Signature QuoteCrawler - Professional Quote Generation',
  description: 'Build professional quotes in minutes with real-time pricing from Signature Solar',
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
