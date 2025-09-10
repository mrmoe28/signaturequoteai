'use client';
import { useMemo, useState } from 'react';
import Wizard from '@/components/Wizard';
import ProductPicker from '@/components/ProductPicker';
import QuotePreview from '@/components/QuotePreview';
import { Quote, QuoteItem, Customer, Product } from '@/lib/types';
import { computeExtended, computeTotals } from '@/lib/compute';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
              qty: i.qty + 1, 
              extended: computeExtended({
                unitPrice: i.unitPrice, 
                qty: i.qty + 1, 
                productId: i.productId, 
                name: i.name
              })
            } 
          : i
      ));
    } else {
      const base = { productId: p.id, name: p.name, unitPrice: p.price, qty: 1 };
      setItems([...items, { ...base, extended: computeExtended(base) }]);
    }
  };

  const totals = useMemo(() => computeTotals(items, { discount, shipping, tax }), [items, discount, shipping, tax]);

  const steps = [
    {
      title: 'Customer',
      content: (
        <div className="grid" style={{ maxWidth: 720 }}>
          <Input 
            placeholder="Company" 
            onChange={e => setCustomer({ ...customer, company: e.target.value })} 
          />
          <Input 
            placeholder="Name" 
            onChange={e => setCustomer({ ...customer, name: e.target.value })} 
          />
          <Input 
            placeholder="Email" 
            onChange={e => setCustomer({ ...customer, email: e.target.value })} 
          />
          <Input 
            placeholder="Phone" 
            onChange={e => setCustomer({ ...customer, phone: e.target.value })} 
          />
          <textarea 
            placeholder="Ship To" 
            onChange={e => setCustomer({ ...customer, shipTo: e.target.value })}
            style={{
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '14px',
              minHeight: '80px',
              resize: 'vertical'
            }}
          />
        </div>
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
                    const qty = i.qty; 
                    const ext = +(v * qty).toFixed(2);
                    setItems(items.map((x, xi) => xi === idx ? { ...x, unitPrice: v, extended: ext } : x));
                  }} 
                />
                <Input
                  type="number" 
                  value={i.qty} 
                  onChange={e => {
                    const q = +e.target.value || 0; 
                    const up = i.unitPrice;
                    const ext = +(up * q).toFixed(2);
                    setItems(items.map((x, xi) => xi === idx ? { ...x, qty: q, extended: ext } : x));
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
              terms: undefined
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