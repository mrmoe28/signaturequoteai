'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ProfileDropdown from '@/components/ProfileDropdown';
import { SessionGuard } from '@/components/SessionGuard';
import QuoteLimitBlocker from '@/components/QuoteLimitBlocker';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkQuotaLimit();
  }, []);

  const checkQuotaLimit = async () => {
    try {
      // Check subscription status
      const subResponse = await fetch('/api/subscriptions/me');
      const subData = await subResponse.json();

      // If user has Pro/Enterprise subscription, they're not blocked
      if (subData.subscription && subData.subscription.plan.slug !== 'free') {
        setIsBlocked(false);
        setLoading(false);
        return;
      }

      // For Free users, check quote count
      const quotesResponse = await fetch('/api/quotes');
      if (quotesResponse.ok) {
        const quotesData = await quotesResponse.json();
        const quoteCount = quotesData.data?.quotes?.length || 0;

        // Block if they've reached the limit (5 quotes)
        if (quoteCount >= 5) {
          setIsBlocked(true);
        }
      }
    } catch (error) {
      console.error('Failed to check quota:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
        </div>
      </div>
    );
  }

  if (isBlocked) {
    return <QuoteLimitBlocker onUpgrade={handleUpgrade} />;
  }

  return (
    <div className="flex h-screen">
      {/* Session-only auth: logout when browser closes */}
      <SessionGuard />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-border bg-background">
          <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
            <a href="/" className="font-extrabold tracking-tight text-sm md:text-lg">Signature Quote</a>
            <div className="flex items-center gap-3 md:gap-6">
              <nav className="flex items-center gap-3 md:gap-6 text-xs md:text-sm">
                <a href="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</a>
                <a href="/quotes/history" className="text-muted-foreground hover:text-foreground">Quotes</a>
                <a href="/products" className="text-muted-foreground hover:text-foreground">Products</a>
                <a href="/customers" className="text-muted-foreground hover:text-foreground">Customers</a>
                <a href="/quotes/new" className="text-muted-foreground hover:text-foreground">New Quote</a>
                <a href="/cart" className="text-muted-foreground hover:text-foreground">Cart</a>
                <a href="/pricing" className="text-blue-600 hover:text-blue-700 font-medium">Upgrade</a>
              </nav>
              <ProfileDropdown />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
