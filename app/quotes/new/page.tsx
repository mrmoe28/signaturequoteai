'use client';
import { useMemo, useState } from 'react';
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

export default function NewQuote() {
  const [customer, setCustomer] = useState<Customer>({ name: '' });
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [shipping, setShipping] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);

  const addProduct = (p: Product) => {
    const existing = items.find(i => i.productId === p.id);
    if (existing) {
      setItems(items.map(i => 
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
      ));
    } else {
      const base = { productId: p.id, name: p.name, unitPrice: p.price, quantity: 1 };
      setItems([...items, { ...base, extended: computeExtended(base) }]);
    }
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
                onChange={e => setCustomer({ ...customer, shipTo: e.target.value })}
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
        <div className="grid">
          <ProductPicker onAdd={addProduct} />
          <div>
            {items.map((i, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '2fr repeat(3, 1fr) auto', 
                  gap: 8, 
                  alignItems: 'center', 
                  borderBottom: '1px solid var(--border)', 
                  padding: '8px 0' 
                }}
              >
                <div>{i.name}</div>
                <Input
                  type="number" 
                  value={i.unitPrice} 
                  onChange={e => {
                    const v = +e.target.value || 0; 
                    const quantity = i.quantity; 
                    const ext = +(v * quantity).toFixed(2);
                    setItems(items.map((x, xi) => xi === idx ? { ...x, unitPrice: v, extended: ext } : x));
                  }} 
                />
                <Input
                  type="number" 
                  value={i.quantity} 
                  onChange={e => {
                    const q = +e.target.value || 0; 
                    const up = i.unitPrice;
                    const ext = +(up * q).toFixed(2);
                    setItems(items.map((x, xi) => xi === idx ? { ...x, quantity: q, extended: ext } : x));
                  }} 
                />
                <div>${i.extended.toFixed(2)}</div>
                <Button onClick={() => setItems(items.filter((_, xi) => xi !== idx))}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
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
              customer: {
                name: 'Sample Customer',
                company: 'Acme Corp',
                email: 'customer@example.com',
                phone: '(555) 123-4567',
                shipTo: '123 Main St, City, ST 12345'
              }
            }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <Button onClick={() => alert('Download PDF (stub)')}>
              Download PDF
            </Button>
            <Button onClick={() => alert('Send Email (stub)')}>
              Send Quote
            </Button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="grid">
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>New Quote</h1>
      <Wizard steps={steps} />
    </div>
  );
}