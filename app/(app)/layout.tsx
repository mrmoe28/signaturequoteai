import ProfileDropdown from '@/components/ProfileDropdown';
import QuoteHistoryLeftSidebar from '@/components/QuoteHistoryLeftSidebar';
import { SessionGuard } from '@/components/SessionGuard';

// Force dynamic rendering - this layout uses session and database queries
export const dynamic = 'force-dynamic';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Session-only auth: logout when browser closes */}
      <SessionGuard />

      {/* Left Sidebar */}
      <QuoteHistoryLeftSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-border bg-background">
          <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
            <a href="/" className="font-extrabold tracking-tight text-sm md:text-lg">Signature QuoteCrawler</a>
            <div className="flex items-center gap-3 md:gap-6">
              <nav className="flex items-center gap-3 md:gap-6 text-xs md:text-sm">
                <a href="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</a>
                <a href="/products" className="text-muted-foreground hover:text-foreground">Products</a>
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
