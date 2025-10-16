'use client';

import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle2, XCircle, Trash2, Eye, Send, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';

interface Quote {
  id: string;
  number: string;
  customerName: string;
  customerCompany?: string;
  total: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined';
  paymentStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  paidAt?: string;
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    extended: number;
  }>;
}

export default function QuoteHistoryLeftSidebar() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('quoteHistorySidebarCollapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('quoteHistorySidebarCollapsed', String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    fetchQuoteHistory();
  }, []);

  const fetchQuoteHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/quotes/history');
      if (response.ok) {
        const data = await response.json();
        setQuotes(data.quotes || []);
      }
    } catch (error) {
      console.error('Failed to fetch quote history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (quoteId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this quote?')) return;
    
    setDeletingId(quoteId);
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setQuotes(quotes.filter(q => q.id !== quoteId));
      } else {
        alert('Failed to delete quote');
      }
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Failed to delete quote');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusIcon = (status: string, paymentStatus?: string) => {
    if (paymentStatus === 'completed') {
      return <DollarSign className="w-4 h-4 text-green-600" />;
    }
    
    switch (status) {
      case 'draft':
        return <FileText className="w-4 h-4 text-gray-400" />;
      case 'sent':
        return <Send className="w-4 h-4 text-blue-500" />;
      case 'viewed':
        return <Eye className="w-4 h-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'declined':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string, paymentStatus?: string) => {
    let label = status.charAt(0).toUpperCase() + status.slice(1);
    let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
    
    if (paymentStatus === 'completed') {
      label = 'Paid';
      variant = 'default';
    } else if (status === 'accepted') {
      variant = 'default';
    } else if (status === 'declined') {
      variant = 'destructive';
    } else if (status === 'sent' || status === 'viewed') {
      variant = 'secondary';
    }
    
    return (
      <Badge variant={variant} className="text-xs">
        {label}
      </Badge>
    );
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'MMM d');
    } catch {
      return 'N/A';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <aside
      className={`border-r border-border bg-background h-screen sticky top-0 flex flex-col transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-80'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg truncate">Quote History</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {quotes.length} {quotes.length === 1 ? 'quote' : 'quotes'}
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 flex-shrink-0"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Quotes List */}
      <div className="flex-1 overflow-y-auto p-4 overflow-x-hidden">
        {loading ? (
          <div className="space-y-3">
            {isCollapsed ? (
              // Collapsed loading state
              [1, 2, 3].map(i => (
                <div key={i} className="h-12 w-12 bg-muted rounded animate-pulse mx-auto" />
              ))
            ) : (
              // Expanded loading state
              [1, 2, 3].map(i => (
                <Card key={i} className="p-3 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </Card>
              ))
            )}
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className={`${isCollapsed ? 'w-8 h-8' : 'w-12 h-12'} mx-auto mb-3 opacity-50`} />
            {!isCollapsed && <p className="text-sm">No quotes yet</p>}
          </div>
        ) : isCollapsed ? (
          // Collapsed view - icon-only
          <div className="space-y-3">
            {quotes.map((quote) => (
              <a
                key={quote.id}
                href={`/quotes/${quote.id}`}
                className="block group"
                title={`${quote.customerName} - ${formatCurrency(quote.total)}`}
              >
                <div className="flex items-center justify-center h-12 w-12 rounded-lg hover:bg-muted transition-colors cursor-pointer mx-auto relative">
                  {getStatusIcon(quote.status, quote.paymentStatus)}
                </div>
              </a>
            ))}
          </div>
        ) : (
          // Expanded view - full cards
          <div className="space-y-3">
            {quotes.map((quote) => (
              <a
                key={quote.id}
                href={`/quotes/${quote.id}`}
                className="block group"
              >
                <Card className="p-3 hover:shadow-md transition-all hover:border-ring cursor-pointer relative">
                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(quote.id, e)}
                    disabled={deletingId === quote.id}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>

                  {/* Quote header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(quote.status, quote.paymentStatus)}
                      <span className="font-medium text-sm">
                        #{quote.number || quote.id.substring(0, 8)}
                      </span>
                    </div>
                    {getStatusBadge(quote.status, quote.paymentStatus)}
                  </div>

                  {/* Customer info */}
                  <div className="mb-2">
                    <p className="text-sm font-medium truncate">
                      {quote.customerName}
                    </p>
                    {quote.customerCompany && (
                      <p className="text-xs text-muted-foreground truncate">
                        {quote.customerCompany}
                      </p>
                    )}
                  </div>

                  {/* Quote details */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {formatDate(quote.sentAt || quote.createdAt)}
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(quote.total)}
                    </span>
                  </div>

                  {/* Items count */}
                  {quote.items && quote.items.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        {quote.items.length} item{quote.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </Card>
              </a>
            ))}
          </div>
        )}
      </div>

    </aside>
  );
}