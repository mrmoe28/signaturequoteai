'use client';
import { useEffect, useMemo, useState } from 'react';
import { Product } from '@/lib/types';
import FreshnessBadge from './FreshnessBadge';
import { money } from '@/lib/formatting';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent } from './ui/Card';

interface ProductPickerProps {
  onAdd: (p: Product) => void;
}

export default function ProductPicker({ onAdd }: ProductPickerProps) {
  const [q, setQ] = useState('');
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => { 
    setLoading(true);
    setError(null);
    
    fetch('/api/signature-solar')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setData(data);
          setLoading(false);
        } else {
          // Fallback to catalog if signature-solar returns empty
          console.log('Signature solar data empty, trying catalog fallback');
          return fetch('/api/catalog').then(r => r.json());
        }
      })
      .catch(err => {
        console.error('Failed to fetch products:', err);
        // Fallback to catalog if signature-solar fails
        return fetch('/api/catalog').then(r => r.json());
      })
      .then(data => {
        if (data) {
          setData(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('All product fetch attempts failed:', err);
        setError('Failed to load products');
        setLoading(false);
      }); 
  }, []);
  
  const filtered = useMemo(() => 
    data.filter(p => (p.name + p.sku).toLowerCase().includes(q.toLowerCase())), 
    [q, data]
  );

  return (
    <div className="space-y-4">
      <Input 
        placeholder="Search products…" 
        value={q} 
        onChange={e => setQ(e.target.value)} 
        className="w-full"
        disabled={loading}
      />
      
      {loading && (
        <div className="text-center py-8 text-muted-foreground">
          Loading products...
        </div>
      )}
      
      {error && (
        <div className="text-center py-8 text-destructive">
          {error}
        </div>
      )}
      
      {!loading && !error && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filtered.map(p => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{p.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      SKU: {p.sku || '—'} • {p.vendor} • {p.category || '—'}
                    </div>
                    <div className="mt-2">
                      <FreshnessBadge iso={p.lastUpdated} />
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-bold text-lg text-foreground">{money(p.price)}</div>
                    <Button onClick={() => onAdd(p)} size="sm" className="mt-2">
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && q && (
            <div className="text-center py-8 text-muted-foreground">
              No products found matching &ldquo;{q}&rdquo;
            </div>
          )}
          {filtered.length === 0 && !q && data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No products available
            </div>
          )}
        </div>
      )}
    </div>
  );
}