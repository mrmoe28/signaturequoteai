'use client';

import { useState, useEffect } from 'react';
import { Boxes, FilePlus2, FileText, Share2, Trash2, Eye, CheckCircle2, XCircle, Clock, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Quote, QuoteStatus } from '@/lib/types';
import { money } from '@/lib/formatting';

type ViewMode = 'table' | 'list';

export default function Dashboard() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const response = await fetch('/api/quotes');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.items) {
            setQuotes(result.data.items);
          }
        }
      } catch (error) {
        console.error('Error fetching quotes:', error);
      }
    };

    fetchQuotes();
  }, []);

  const getStatusBadge = (status?: QuoteStatus) => {
    if (!status) return null;

    const variants: Record<QuoteStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: any, label: string }> = {
      draft: { variant: 'secondary', icon: FileText, label: 'Draft' },
      sent: { variant: 'default', icon: Send, label: 'Sent' },
      viewed: { variant: 'outline', icon: Eye, label: 'Viewed' },
      accepted: { variant: 'default', icon: CheckCircle2, label: 'Accepted' },
      declined: { variant: 'destructive', icon: XCircle, label: 'Declined' },
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

  const handleDelete = async (quoteId: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) return;

    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setQuotes(quotes.filter(q => q.id !== quoteId));
      }
    } catch (error) {
      console.error('Error deleting quote:', error);
    }
  };

  const handleShare = async (quote: Quote) => {
    // TODO: Implement share functionality
    console.log('Sharing quote:', quote);
  };


  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Quick actions and shortcuts</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href="/quotes/new"
          className="group relative rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-5 shadow-lg hover:shadow-xl transition-all hover:border-ring"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
              <FilePlus2 className="h-5 w-5" />
            </span>
            <div className="grid gap-1">
              <div className="font-semibold">New Quote</div>
              <div className="text-sm text-muted-foreground">Start a new customer quote</div>
            </div>
          </div>
        </a>

        <a
          href="/products"
          className="group relative rounded-xl border border-border bg-gradient-to-br from-foreground/[0.03] to-transparent p-5 shadow-lg hover:shadow-xl transition-all hover:border-ring"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-foreground/10 text-foreground ring-1 ring-inset ring-foreground/20">
              <Boxes className="h-5 w-5" />
            </span>
            <div className="grid gap-1">
              <div className="font-semibold">Products</div>
              <div className="text-sm text-muted-foreground">Browse the latest catalog</div>
            </div>
          </div>
        </a>
      </div>

      {/* Quotes Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Quotes
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                Table
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {quotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No quotes yet</p>
              <p className="text-sm">Create your first quote to get started</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-sm">Quote #</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Total</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Date</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-medium">{quote.number || quote.id?.substring(0, 8)}</td>
                      <td className="py-3 px-4">{quote.customer.name}</td>
                      <td className="py-3 px-4 font-semibold">{money(quote.total)}</td>
                      <td className="py-3 px-4">{getStatusBadge(quote.status)}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShare(quote)}
                            className="h-8 w-8 p-0"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => quote.id && handleDelete(quote.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-3">
              {quotes.map((quote) => (
                <Card key={quote.id} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 grid gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">
                            {quote.number || `#${quote.id?.substring(0, 8)}`}
                          </span>
                          {getStatusBadge(quote.status)}
                        </div>
                        <div className="text-sm">
                          <p className="font-medium">{quote.customer.name}</p>
                          {quote.customer.company && (
                            <p className="text-muted-foreground">{quote.customer.company}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                          <div className="font-bold text-foreground">{money(quote.total)}</div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShare(quote)}
                          className="w-full"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => quote.id && handleDelete(quote.id)}
                          className="w-full text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
