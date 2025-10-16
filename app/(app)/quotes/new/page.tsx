'use client';
import { useMemo, useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Wizard from '@/components/Wizard';
import ProductPicker from '@/components/ProductPicker';
import QuotePreview from '@/components/QuotePreview';
import { Quote, QuoteItem, Customer, Product } from '@/lib/types';
import { computeExtended, computeTotals } from '@/lib/compute';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ShoppingCart, AlertCircle } from 'lucide-react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import UpgradePrompt from '@/components/UpgradePrompt';

function NewQuoteContent() {
  const searchParams = useSearchParams();
  const [customer, setCustomer] = useState<Customer>({ name: '' });
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [shipping, setShipping] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [shipTo, setShipTo] = useState<string>('');
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [currentQuoteCount, setCurrentQuoteCount] = useState<number>(0);

  // Feature gating
  const { subscription, loading: featureLoading, canDo, showUpgradePrompt, upgradePromptProps } = useFeatureAccess();

  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const response = await fetch('/api/company');
        if (response.ok) {
          const data = await response.json();
          setCompanySettings(data);
        }
      } catch (error) {
        console.error('Failed to fetch company settings:', error);
      }
    };
    fetchCompanySettings();
  }, []);

  // Fetch current quote count for this billing period
  useEffect(() => {
    const fetchQuoteCount = async () => {
      try {
        const response = await fetch('/api/quotes');
        if (response.ok) {
          const data = await response.json();
          // Count quotes from current billing period (this month)
          const now = new Date();
          const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const quotesThisMonth = data.data?.quotes?.filter((q: any) => {
            const createdAt = new Date(q.createdAt);
            return createdAt >= currentMonthStart;
          }) || [];
          setCurrentQuoteCount(quotesThisMonth.length);
        }
      } catch (error) {
        console.error('Failed to fetch quote count:', error);
      }
    };
    fetchQuoteCount();
  }, []);

  // Load items from localStorage when coming from cart
  useEffect(() => {
    const fromCart = searchParams?.get('fromCart');
    if (fromCart === 'true') {
      const savedItems = localStorage.getItem('quoteItems');
      if (savedItems) {
        try {
          const parsedItems = JSON.parse(savedItems);
          setItems(parsedItems);
          // Update addedProducts set to reflect items from cart
          const productIds = new Set<string>(parsedItems.map((item: QuoteItem) => item.productId));
          setAddedProducts(productIds);
        } catch (error) {
          console.error('Failed to parse saved quote items:', error);
        }
      }
    }
  }, [searchParams]);

  const addProduct = (p: Product) => {
    const existing = items.find(i => i.productId === p.id);
    let updatedItems;
    
    if (existing) {
      updatedItems = items.map(i => 
        i.productId === p.id 
          ? {
              ...i, 
              quantity: i.quantity + 1, 
              extended: computeExtended({
                unitPrice: i.unitPrice, 
                quantity: i.quantity + 1, 
                productId: i.productId, 
                name: i.name
              })
            } 
          : i
      );
      setShowSuccess(`Quantity increased for ${p.name}`);
    } else {
      const base = { productId: p.id, name: p.name, unitPrice: p.price, quantity: 1, imageUrl: p.images?.[0]?.url || p.primaryImageUrl };
      updatedItems = [...items, { ...base, extended: computeExtended(base) }];
      setShowSuccess(`Added ${p.name} to quote`);
    }
    
    setItems(updatedItems);
    
    // Save to localStorage for cart page
    localStorage.setItem('quoteItems', JSON.stringify(updatedItems));
    
    // Add to added products set for visual feedback
    setAddedProducts(prev => new Set(Array.from(prev).concat(p.id)));
    
    // Clear success message after 3 seconds
    setTimeout(() => setShowSuccess(null), 3000);
  };

  const updateItems = (newItems: QuoteItem[]) => {
    setItems(newItems);
    localStorage.setItem('quoteItems', JSON.stringify(newItems));
  };

  const totals = useMemo(() => computeTotals(items, { discount, shipping, tax }), [items, discount, shipping, tax]);

  const steps = [
    {
      title: 'Customer',
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-w-2xl">
            <div>
              <Label htmlFor="company">Company Name</Label>
              <Input 
                id="company"
                placeholder="Acme Corp" 
                onChange={e => setCustomer({ ...customer, company: e.target.value })} 
              />
            </div>
            <div>
              <Label htmlFor="name">Contact Name</Label>
              <Input 
                id="name"
                placeholder="John Smith" 
                onChange={e => setCustomer({ ...customer, name: e.target.value })} 
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email"
                type="email"
                placeholder="john@acme.com" 
                onChange={e => setCustomer({ ...customer, email: e.target.value })} 
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone"
                placeholder="(555) 123-4567" 
                onChange={e => setCustomer({ ...customer, phone: e.target.value })} 
              />
            </div>
            <div>
              <Label htmlFor="shipTo">Shipping Address</Label>
              <Textarea
                id="shipTo"
                placeholder="Full shipping address including city, state, zip"
                onChange={e => setShipTo(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      title: 'Items',
      content: (
        <div className="space-y-6">
          <ProductPicker onAdd={addProduct} addedProducts={addedProducts} />
          
          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Quote Items ({items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((i, idx) => (
                    <div 
                      key={idx} 
                      className="grid grid-cols-12 gap-4 items-center p-4 border border-border rounded-lg bg-muted/20"
                    >
                      <div className="col-span-4">
                        <div className="font-medium">{i.name}</div>
                        <div className="text-sm text-muted-foreground">Product ID: {i.productId}</div>
                      </div>
                      
                      <div className="col-span-2">
                        <Label htmlFor={`price-${idx}`} className="text-xs">Unit Price</Label>
                        <Input
                          id={`price-${idx}`}
                          type="number" 
                          value={i.unitPrice || ''} 
                          onChange={e => {
                            const v = e.target.value ? +e.target.value : null; 
                            const quantity = i.quantity; 
                            const ext = v ? +(v * quantity).toFixed(2) : 0;
                            setItems(items.map((x, xi) => xi === idx ? { ...x, unitPrice: v, extended: ext } : x));
                          }} 
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Label htmlFor={`qty-${idx}`} className="text-xs">Quantity</Label>
                        <Input
                          id={`qty-${idx}`}
                          type="number" 
                          value={i.quantity} 
                        onChange={e => {
                          const q = +e.target.value || 0;
                          const up = i.unitPrice;
                          const ext = up ? +(up * q).toFixed(2) : 0;
                          updateItems(items.map((x, xi) => xi === idx ? { ...x, quantity: q, extended: ext } : x));
                        }}
                          min="1"
                        />
                      </div>
                      
                      <div className="col-span-2 text-right">
                        <div className="text-sm text-muted-foreground">Extended</div>
                        <div className="font-bold text-lg">${i.extended.toFixed(2)}</div>
                      </div>
                      
                      <div className="col-span-2 flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                        onClick={() => {
                          const newQty = Math.max(1, i.quantity - 1);
                          const ext = i.unitPrice ? +(i.unitPrice * newQty).toFixed(2) : 0;
                          updateItems(items.map((x, xi) => xi === idx ? { ...x, quantity: newQty, extended: ext } : x));
                        }}
                          disabled={i.quantity <= 1}
                        >
                          -
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                        onClick={() => {
                          const newQty = i.quantity + 1;
                          const ext = i.unitPrice ? +(i.unitPrice * newQty).toFixed(2) : 0;
                          updateItems(items.map((x, xi) => xi === idx ? { ...x, quantity: newQty, extended: ext } : x));
                        }}
                        >
                          +
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => updateItems(items.filter((_, xi) => xi !== idx))}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {items.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-muted-foreground">
                  No items added yet. Search and add products above.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )
    },
    {
      title: 'Pricing',
      content: (
        <div className="grid" style={{ maxWidth: 480 }}>
          <label>Order Discount %</label>
          <Input
            type="number" 
            value={discount} 
            onChange={e => setDiscount(+e.target.value || 0)} 
          />
          <label>Shipping $</label>
          <Input
            type="number" 
            value={shipping} 
            onChange={e => setShipping(+e.target.value || 0)} 
          />
          <label>Tax %</label>
          <Input
            type="number" 
            value={tax} 
            onChange={e => setTax(+e.target.value || 0)} 
          />
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <div>Subtotal: ${totals.subtotal.toFixed(2)}</div>
            <div>Total: ${totals.total.toFixed(2)}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Preview & Send',
      content: (
        <div className="grid">
          <QuotePreview
            quote={{
              id: crypto.randomUUID(),
              number: undefined,
              createdAt: new Date().toISOString(),
              validUntil: undefined,
              preparedBy: 'Sales',
              leadTimeNote: 'Typical lead time 1–2 weeks',
              discount,
              shipping,
              tax,
              items,
              subtotal: totals.subtotal,
              total: totals.total,
              terms: undefined,
              shipTo: shipTo || undefined,
              customer
            }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              onClick={async () => {
                // Check quote limit before creating
                const accessCheck = canDo({
                  metric: 'quotes',
                  currentUsage: currentQuoteCount,
                });

                if (!accessCheck.allowed) {
                  showUpgradePrompt(undefined, 'quotes');
                  return;
                }

                if (!customer.email) {
                  alert('Customer email is required to send quote');
                  return;
                }

                try {
                  // First save the quote to get an ID
                  const response = await fetch('/api/quotes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      customer,
                      items,
                      discount,
                      shipping,
                      tax,
                      shipTo: shipTo || undefined,
                      subtotal: totals.subtotal,
                      total: totals.total,
                      preparedBy: companySettings?.preparedBy || 'Sales Team',
                      leadTimeNote: companySettings?.defaultLeadTime || 'Typical lead time 1–2 weeks',
                    }),
                  });

                  if (response.ok) {
                    const result = await response.json();
                    const quoteId = result.data.id;

                    // Send email
                    const emailResponse = await fetch(`/api/quotes/${quoteId}/send`, {
                      method: 'POST',
                    });

                    if (emailResponse.ok) {
                      const emailResult = await emailResponse.json();
                      alert(`Quote sent successfully to ${customer.email}!`);
                    } else {
                      const error = await emailResponse.json();
                      alert(`Failed to send email: ${error.message}`);
                    }
                  } else {
                    const error = await response.json();
                    alert(`Failed to save quote: ${error.message}`);
                  }
                } catch (error) {
                  console.error('Failed to send quote:', error);
                  alert('Failed to send quote');
                }
              }}
            >
              Send Quote
            </Button>
          </div>
        </div>
      )
    }
  ];

  // Check if user is approaching their quote limit
  const quoteLimit = subscription?.plan.limits.quotes || 5; // Free plan = 5
  const isUnlimited = quoteLimit === null;
  const isNearLimit = !isUnlimited && currentQuoteCount >= quoteLimit * 0.8; // 80% threshold
  const hasReachedLimit = !isUnlimited && currentQuoteCount >= quoteLimit;

  return (
    <div className="w-full max-w-none px-6 py-8">
      {/* Usage Warning Banner */}
      {!featureLoading && !isUnlimited && isNearLimit && (
        <div className={`mb-6 p-4 rounded-lg border ${hasReachedLimit ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 mt-0.5 ${hasReachedLimit ? 'text-red-600' : 'text-yellow-600'}`} />
            <div className="flex-1">
              <p className={`font-semibold ${hasReachedLimit ? 'text-red-900' : 'text-yellow-900'}`}>
                {hasReachedLimit ? 'Quote Limit Reached' : 'Approaching Quote Limit'}
              </p>
              <p className={`text-sm ${hasReachedLimit ? 'text-red-700' : 'text-yellow-700'}`}>
                {hasReachedLimit
                  ? `You've used all ${quoteLimit} quotes this month. Upgrade to Pro for unlimited quotes.`
                  : `You've used ${currentQuoteCount} of ${quoteLimit} quotes this month. Upgrade to Pro for unlimited quotes.`
                }
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => window.location.href = '/pricing'}
              >
                View Plans
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">New Quote</h1>
          {!featureLoading && !isUnlimited && (
            <p className="text-sm text-muted-foreground mt-1">
              {currentQuoteCount} / {quoteLimit} quotes used this month
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {items.length > 0 && (
            <>
              <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium">
                {items.length} item{items.length !== 1 ? 's' : ''} in quote
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/cart'}
                className="flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                View Cart
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-in slide-in-from-right duration-300">
          <div className="flex items-center gap-2">
            <span className="text-lg">✓</span>
            <span className="font-medium">{showSuccess}</span>
          </div>
        </div>
      )}

      <Wizard steps={steps} />

      {/* Upgrade Prompt Modal */}
      <UpgradePrompt {...upgradePromptProps} />
    </div>
  );
}

export default function NewQuote() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <NewQuoteContent />
    </Suspense>
  );
}