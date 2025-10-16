'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  Users,
  Mail,
  Phone,
  MapPin,
  Building2,
  FileText,
  Calendar,
  DollarSign,
  Eye,
  AlertCircle,
  RefreshCw,
  Pencil,
} from 'lucide-react';
import Link from 'next/link';

interface Customer {
  id: string;
  company?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  notes?: string;
  createdAt?: string;
}

interface Quote {
  id: string;
  quoteNumber?: string;
  status: string;
  subtotal: number;
  discount?: number;
  shipping?: number;
  tax?: number;
  total: number;
  validUntil?: string;
  createdAt: string;
  sentAt?: string;
}

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomerDetails();
    fetchCustomerQuotes();
  }, [resolvedParams.id]);

  const fetchCustomerDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/customers/${resolvedParams.id}`);
      if (response.ok) {
        const result = await response.json();
        setCustomer(result.data?.customer || null);
      } else {
        setError(`Failed to load customer: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch customer:', error);
      setError('Unable to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerQuotes = async () => {
    try {
      const response = await fetch(`/api/quotes?customerId=${resolvedParams.id}`);
      if (response.ok) {
        const result = await response.json();
        setQuotes(result.data?.quotes || []);
      }
    } catch (error) {
      console.error('Failed to fetch customer quotes:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'sent') return 'bg-blue-100 text-blue-800';
    if (statusLower === 'viewed') return 'bg-purple-100 text-purple-800';
    if (statusLower === 'accepted') return 'bg-green-100 text-green-800';
    if (statusLower === 'rejected') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] text-primary" />
          <p className="text-sm text-muted-foreground mt-4">Loading customer...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/customers')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Customers
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive opacity-80" />
              <p className="text-lg mb-2 font-semibold text-destructive">Customer Not Found</p>
              <p className="text-sm text-muted-foreground mb-4">{error || 'This customer does not exist'}</p>
              <Button onClick={() => router.push('/customers')} variant="outline">
                Return to Customers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalRevenue = quotes.reduce((sum, quote) => sum + quote.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/customers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">{customer.name}</h1>
              {customer.company && (
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                  <Building2 className="w-4 h-4" />
                  {customer.company}
                </p>
              )}
            </div>
          </div>
        </div>
        <Button onClick={() => router.push('/customers')} variant="outline">
          <Pencil className="w-4 h-4 mr-2" />
          Edit Customer
        </Button>
      </div>

      {/* Customer Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Details */}
            <div className="space-y-4">
              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                      {customer.email}
                    </a>
                  </div>
                </div>
              )}

              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <a href={`tel:${customer.phone}`} className="text-primary hover:underline">
                      {customer.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="space-y-4">
              {(customer.address || customer.city || customer.state) && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <div className="text-sm">
                      {customer.address && <p>{customer.address}</p>}
                      {(customer.city || customer.state || customer.zip) && (
                        <p>
                          {[customer.city, customer.state, customer.zip].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {customer.country && customer.country !== 'USA' && <p>{customer.country}</p>}
                    </div>
                  </div>
                </div>
              )}

              {customer.createdAt && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Since</p>
                    <p className="text-sm">{formatDate(customer.createdAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {customer.notes && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-2">Notes</p>
              <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Quotes</p>
                <p className="text-2xl font-bold">{quotes.length}</p>
              </div>
              <FileText className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accepted Quotes</p>
                <p className="text-2xl font-bold">
                  {quotes.filter((q) => q.status.toLowerCase() === 'accepted').length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quote History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Quote History
            </CardTitle>
            <Link href={`/quotes/new?customerId=${customer.id}`}>
              <Button size="sm">
                <FileText className="w-4 h-4 mr-2" />
                New Quote
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {quotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No quotes yet</p>
              <p className="text-sm mb-4">Create a quote for this customer to get started</p>
              <Link href={`/quotes/new?customerId=${customer.id}`}>
                <Button size="sm">Create First Quote</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-sm">Quote #</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm">Amount</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => (
                    <tr
                      key={quote.id}
                      className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium">
                          {quote.quoteNumber || `#${quote.id.slice(0, 8)}`}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {formatDate(quote.createdAt)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(quote.status)}>{quote.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold">{formatCurrency(quote.total)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/quotes/${quote.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View quote">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
