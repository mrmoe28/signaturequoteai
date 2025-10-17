import type { Metadata } from 'next';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Signature Quote - Professional Quote Generation',
  description: 'Build professional quotes in minutes with real-time pricing',
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
