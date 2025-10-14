'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuoteItem, Product } from '@/lib/types';
import { computeTotals } from '@/lib/compute';
import { money } from '@/lib/formatting';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingCart } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [shipping, setShipping] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Load cart items from localStorage
  useEffect(() => {
    const savedItems = localStorage.getItem('quoteItems');
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
    setLoading(false);
  }, []);

  // Load products for additional info
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/signature-solar');
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error('Failed to load products:', error);
      }
    };
    loadProducts();
  }, []);

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }

    const updatedItems = items.map(item => 
      item.productId === productId 
        ? {
            ...item,
            quantity: newQuantity,
            extended: (item.unitPrice || 0) * newQuantity
          }
        : item
    );
    setItems(updatedItems);
    localStorage.setItem('quoteItems', JSON.stringify(updatedItems));
  };

  const removeItem = (productId: string) => {
    const updatedItems = items.filter(item => item.productId !== productId);
    setItems(updatedItems);
    localStorage.setItem('quoteItems', JSON.stringify(updatedItems));
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('quoteItems');
  };

  const proceedToQuote = () => {
    // Navigate to quote creation with cart items
    router.push('/quotes/new?fromCart=true');
  };

  const totals = computeTotals(items, { discount, shipping, tax });

  if (loading) {
    return (
      <div className="w-full max-w-none px-6 py-8">
        <div className="text-center py-16">
          <div className="text-lg text-muted-foreground">Loading cart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingCart className="w-8 h-8" />
            Shopping Cart
          </h1>
        </div>
        {items.length > 0 && (
          <Button variant="outline" onClick={clearCart} className="text-destructive">
            Clear Cart
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Add some products to your quote to get started.
            </p>
            <Button onClick={() => router.push('/quotes/new')} size="lg">
              Start Building Quote
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              Quote Items ({items.length})
            </h2>
            
            {items.map((item) => {
              const product = products.find(p => p.id === item.productId);
              return (
                <Card key={item.productId} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-foreground leading-tight mb-2">
                          {item.name}
                        </h3>
                        <div className="text-sm text-muted-foreground mb-3">
                          <span className="inline-block bg-muted px-2 py-1 rounded text-xs font-medium mr-2">
                            SKU: {product?.sku || '—'}
                          </span>
                          <span className="inline-block bg-muted px-2 py-1 rounded text-xs font-medium mr-2">
                            {product?.vendor || 'Unknown'}
                          </span>
                          {product?.category && (
                            <span className="inline-block bg-muted px-2 py-1 rounded text-xs font-medium">
                              {product.category}
                            </span>
                          )}
                        </div>
                        <div className="text-lg font-bold text-foreground">
                          {money(item.unitPrice)} each
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <div className="w-16 text-center">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                              min="1"
                              className="text-center"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {/* Extended Price */}
                        <div className="text-right min-w-[120px]">
                          <div className="text-sm text-muted-foreground">Total</div>
                          <div className="font-bold text-xl text-foreground">
                            {money(item.extended)}
                          </div>
                        </div>
                        
                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.productId)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Quote Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pricing Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{money(totals.subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-green-600">
                      -{money(discount)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">{money(shipping)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">{money(tax)}</span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{money(totals.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Additional Options */}
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="discount" className="text-sm">Discount ($)</Label>
                    <Input
                      id="discount"
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="shipping" className="text-sm">Shipping ($)</Label>
                    <Input
                      id="shipping"
                      type="number"
                      value={shipping}
                      onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tax" className="text-sm">Tax ($)</Label>
                    <Input
                      id="tax"
                      type="number"
                      value={tax}
                      onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4 border-t">
                  <Button 
                    onClick={proceedToQuote} 
                    size="lg" 
                    className="w-full"
                  >
                    Proceed to Quote
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/quotes/new')}
                    size="lg" 
                    className="w-full"
                  >
                    Continue Shopping
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
