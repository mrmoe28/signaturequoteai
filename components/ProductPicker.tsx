'use client';
import { useEffect, useMemo, useState } from 'react';
import { Product } from '@/lib/types';
import FreshnessBadge from './FreshnessBadge';
import { money } from '@/lib/formatting';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface ProductPickerProps {
  onAdd: (p: Product) => void;
}

export default function ProductPicker({ onAdd }: ProductPickerProps) {
  const [q, setQ] = useState('');
  const [data, setData] = useState<Product[]>([]);
  
  useEffect(() => { 
    fetch('/api/catalog')
      .then(r => r.json())
      .then(setData); 
  }, []);
  
  const filtered = useMemo(() => 
    data.filter(p => (p.name + p.sku).toLowerCase().includes(q.toLowerCase())), 
    [q, data]
  );

  return (
    <div className="grid">
      <Input 
        placeholder="Search products…" 
        value={q} 
        onChange={e => setQ(e.target.value)} 
      />
      <div style={{ display: 'grid', gap: 10 }}>
        {filtered.map(p => (
          <div 
            key={p.id} 
            style={{ 
              border: '1px solid var(--border)', 
              borderRadius: 10, 
              padding: 10, 
              display: 'grid', 
              gridTemplateColumns: '1fr auto', 
              alignItems: 'center' 
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                SKU: {p.sku || '—'} • {p.vendor} • {p.category || '—'}
              </div>
              <FreshnessBadge iso={p.lastUpdated} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700 }}>{money(p.price)}</div>
              <Button onClick={() => onAdd(p)} style={{ marginTop: 6 }}>
                Add
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}