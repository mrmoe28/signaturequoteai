'use client';

import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle2, XCircle, Trash2, Eye, Send, DollarSign } from 'lucide-react';
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

export default function QuoteHistoryPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async (quoteId: string) => {
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
      return <DollarSign className="w-5 h-5 text-green-600" />;
    }

    switch (status) {
      case 'draft':
        return <FileText className="w-5 h-5 text-gray-400" />;
      case 'sent':
        return <Send className="w-5 h-5 text-blue-500" />;
      case 'viewed':
        return <Eye className="w-5 h-5 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'declined':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
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
      return format(new Date(date), 'MMM d, yyyy');
    } catch {
      return 'N/A';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Quote History</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {quotes.length} {quotes.length === 1 ? 'quote' : 'quotes'} total
        </p>
      </div>

      {/* Quotes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="p-4 md:p-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-3/4 mb-3" />
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </Card>
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <div className="text-center py-12 md:py-20">
          <FileText className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <h3 className="text-lg md:text-xl font-semibold mb-2">No quotes yet</h3>
          <p className="text-sm md:text-base text-muted-foreground mb-6">
            Create your first quote to get started
          </p>
          <Button asChild>
            <a href="/quotes/new">Create Quote</a>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {quotes.map((quote) => (
            <a
              key={quote.id}
              href={`/quotes/${quote.id}`}
              className="block group"
            >
              <Card className="p-4 md:p-6 hover:shadow-lg transition-all hover:border-ring cursor-pointer relative h-full">
                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(quote.id);
                  }}
                  disabled={deletingId === quote.id}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>

                {/* Quote header */}
                <div className="flex items-start gap-3 mb-4">
                  {getStatusIcon(quote.status, quote.paymentStatus)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-base md:text-lg truncate">
                        #{quote.number || quote.id.substring(0, 8)}
                      </span>
                      {getStatusBadge(quote.status, quote.paymentStatus)}
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {formatDate(quote.sentAt || quote.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Customer info */}
                <div className="mb-4 pb-4 border-b border-border">
                  <p className="font-medium text-sm md:text-base truncate mb-1">
                    {quote.customerName}
                  </p>
                  {quote.customerCompany && (
                    <p className="text-xs md:text-sm text-muted-foreground truncate">
                      {quote.customerCompany}
                    </p>
                  )}
                </div>

                {/* Quote details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold text-base md:text-lg">
                      {formatCurrency(quote.total)}
                    </span>
                  </div>
                  {quote.items && quote.items.length > 0 && (
                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">Items</span>
                      <span className="font-medium">
                        {quote.items.length} item{quote.items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
