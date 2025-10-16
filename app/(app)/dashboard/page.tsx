'use client';

import { useState, useEffect } from 'react';
import { Boxes, FilePlus2, FileText, DollarSign, Eye, CheckCircle2, Clock, Send, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Quote, QuoteStatus } from '@/lib/types';
import { money } from '@/lib/formatting';

export default function Dashboard() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/quotes');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.items) {
          setQuotes(result.data.items);
        } else {
          setError('Failed to load quotes. Please try again.');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
      setError('Unable to connect to the database. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  // Calculate statistics
  const stats = {
    total: quotes.length,
    sent: quotes.filter(q => q.status === 'sent' || q.status === 'viewed').length,
    paid: quotes.filter(q => (q as any).paymentStatus === 'completed').length,
    pending: quotes.filter(q => q.status === 'sent' || q.status === 'viewed').length,
  };

  const totalRevenue = quotes
    .filter(q => (q as any).paymentStatus === 'completed')
    .reduce((sum, q) => sum + q.total, 0);

  const getStatusBadge = (status?: QuoteStatus) => {
    if (!status) return null;

    const variants: Record<QuoteStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: any, label: string }> = {
      draft: { variant: 'secondary', icon: FileText, label: 'Draft' },
      sent: { variant: 'default', icon: Send, label: 'Sent' },
      viewed: { variant: 'outline', icon: Eye, label: 'Viewed' },
      accepted: { variant: 'default', icon: CheckCircle2, label: 'Accepted' },
      declined: { variant: 'destructive', icon: Clock, label: 'Declined' },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Get recent quotes (limit to 5)
  const recentQuotes = quotes.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Overview of your quotes and business activity
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Quotes */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time quotes created
            </p>
          </CardContent>
        </Card>

        {/* Quotes Sent/Received */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quotes Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{stats.sent}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting customer response
            </p>
          </CardContent>
        </Card>

        {/* Quotes Paid */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quotes Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-green-600">
              {stats.paid}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {money(totalRevenue)} collected
            </p>
          </CardContent>
        </Card>

        {/* Quotes Pending */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting action
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <a
          href="/quotes/new"
          className="group relative rounded-lg md:rounded-xl border border-border bg-gradient-to-br from-blue-500/10 to-transparent p-5 md:p-6 shadow-lg hover:shadow-xl transition-all hover:border-blue-500/50"
        >
          <div className="flex items-start gap-4">
            <span className="inline-flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 ring-2 ring-blue-500/20">
              <FilePlus2 className="h-5 w-5 md:h-6 md:w-6" />
            </span>
            <div className="flex-1">
              <div className="font-semibold text-base md:text-lg mb-1">Create New Quote</div>
              <div className="text-sm text-muted-foreground">Start a new customer quote</div>
            </div>
          </div>
        </a>

        <a
          href="/products"
          className="group relative rounded-lg md:rounded-xl border border-border bg-gradient-to-br from-purple-500/10 to-transparent p-5 md:p-6 shadow-lg hover:shadow-xl transition-all hover:border-purple-500/50"
        >
          <div className="flex items-start gap-4">
            <span className="inline-flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 ring-2 ring-purple-500/20">
              <Boxes className="h-5 w-5 md:h-6 md:w-6" />
            </span>
            <div className="flex-1">
              <div className="font-semibold text-base md:text-lg mb-1">Browse Products</div>
              <div className="text-sm text-muted-foreground">View latest catalog</div>
            </div>
          </div>
        </a>
      </div>

      {/* Recent Quotes */}
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg md:text-xl flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Quotes
          </CardTitle>
          <Button asChild variant="outline" size="sm">
            <a href="/quotes/history">View All</a>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent text-primary" />
              <p className="text-sm text-muted-foreground mt-4">Loading quotes...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 text-destructive opacity-80" />
              <p className="text-lg mb-2 font-semibold text-destructive">Error Loading Quotes</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchQuotes} variant="outline" size="sm">
                Retry
              </Button>
            </div>
          ) : recentQuotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No quotes yet</p>
              <p className="text-sm mb-6">Create your first quote to get started</p>
              <Button asChild>
                <a href="/quotes/new">Create Quote</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentQuotes.map((quote) => (
                <a
                  key={quote.id}
                  href={`/quotes/${quote.id}`}
                  className="block group"
                >
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-ring hover:shadow-md transition-all">
                    <div className="flex-1 min-w-0 grid gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm md:text-base truncate">
                          #{quote.number || quote.id?.substring(0, 8)}
                        </span>
                        {getStatusBadge(quote.status)}
                      </div>
                      <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                        <span className="truncate">{quote.customer.name}</span>
                        {quote.customer.company && (
                          <>
                            <span>•</span>
                            <span className="truncate">{quote.customer.company}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs text-muted-foreground">
                          {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <div className="font-bold text-base md:text-lg whitespace-nowrap">
                        {money(quote.total)}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
