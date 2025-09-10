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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
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
  
  // Function to categorize products based on their names
  const categorizeProduct = (product: Product): string => {
    const name = product.name.toLowerCase();
    if (name.includes('inverter')) return 'Inverters';
    if (name.includes('generator')) return 'Generators';
    if (name.includes('battery') || name.includes('storage')) return 'Battery Storage';
    if (name.includes('panel') || name.includes('solar panel')) return 'Solar Panels';
    if (name.includes('rack') || name.includes('mount')) return 'Racking & Mounting';
    if (name.includes('cable') || name.includes('wire')) return 'Cables & Wiring';
    if (name.includes('monitor') || name.includes('meter')) return 'Monitoring';
    if (name.includes('switch') || name.includes('breaker')) return 'Electrical';
    return 'Other';
  };

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(data.map(categorizeProduct)));
    return ['all', ...uniqueCategories];
  }, [data]);

  const filtered = useMemo(() => {
    let filteredData = data.filter(p => (p.name + p.sku).toLowerCase().includes(q.toLowerCase()));
    
    if (selectedCategory !== 'all') {
      filteredData = filteredData.filter(p => categorizeProduct(p) === selectedCategory);
    }
    
    return filteredData;
  }, [q, data, selectedCategory]);

  return (
    <div className="flex gap-6">
      {/* Category Sidebar */}
      <div className="w-64 flex-shrink-0">
        <div className="sticky top-4">
          <h3 className="font-semibold text-sm text-muted-foreground mb-3">Categories</h3>
          <div className="space-y-1">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {category === 'all' ? 'All Products' : category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-4">
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
                        SKU: {p.sku || '—'} • {p.vendor} • {categorizeProduct(p)}
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
                {selectedCategory !== 'all' && ` in ${selectedCategory}`}
              </div>
            )}
            {filtered.length === 0 && !q && selectedCategory !== 'all' && (
              <div className="text-center py-8 text-muted-foreground">
                No products found in {selectedCategory}
              </div>
            )}
            {filtered.length === 0 && !q && selectedCategory === 'all' && data.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No products available
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}