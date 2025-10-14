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
  addedProducts?: Set<string>;
}

export default function ProductPicker({ onAdd, addedProducts = new Set() }: ProductPickerProps) {
  const [q, setQ] = useState('');
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Fetch products from database
    fetch('/api/products?active_only=true')
      .then(r => r.json())
      .then(result => {
        if (result.success && result.data?.items) {
          setData(result.data.items);
        } else {
          throw new Error('Failed to load products from database');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch products:', err);
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
    <div className="flex gap-8 min-h-0">
      {/* Category Sidebar */}
      <div className="w-72 flex-shrink-0">
        <div className="sticky top-4">
          <h3 className="font-semibold text-sm text-muted-foreground mb-4">Categories</h3>
          <div className="space-y-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground shadow-sm'
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
      <div className="flex-1 min-w-0 space-y-6">
        <Input 
          placeholder="Search products…" 
          value={q} 
          onChange={e => setQ(e.target.value)} 
          className="w-full text-base"
          disabled={loading}
        />
        
        {loading && (
          <div className="text-center py-12 text-muted-foreground">
            Loading products...
          </div>
        )}
        
        {error && (
          <div className="text-center py-12 text-destructive">
            {error}
          </div>
        )}
        
        {!loading && !error && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {filtered.map(p => (
              <Card key={p.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    {/* Product Image */}
                    {(p.images?.[0]?.url || p.primaryImageUrl) && (
                      <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={p.images?.[0]?.url || p.primaryImageUrl || "/images/placeholder.svg"}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;
                            if (img.src.endsWith("/images/placeholder.svg")) return;
                            img.src = "/images/placeholder.svg";
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-lg text-foreground leading-tight mb-2">{p.name}</div>
                      <div className="text-sm text-muted-foreground mb-3">
                        <span className="inline-block bg-muted px-2 py-1 rounded text-xs font-medium mr-2">
                          SKU: {p.sku || '—'}
                        </span>
                        <span className="inline-block bg-muted px-2 py-1 rounded text-xs font-medium mr-2">
                          {p.vendor}
                        </span>
                        <span className="inline-block bg-muted px-2 py-1 rounded text-xs font-medium">
                          {categorizeProduct(p)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FreshnessBadge iso={p.lastUpdated} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-2xl text-foreground mb-3">{money(p.price)}</div>
                      <Button 
                        onClick={() => onAdd(p)} 
                        size="lg" 
                        className="px-6"
                        variant={addedProducts.has(p.id) ? "secondary" : "default"}
                      >
                        {addedProducts.has(p.id) ? "✓ Added" : "Add to Quote"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && q && (
              <div className="text-center py-16 text-muted-foreground">
                <div className="text-lg font-medium mb-2">No products found</div>
                <div className="text-sm">
                  No products found matching &ldquo;{q}&rdquo;
                  {selectedCategory !== 'all' && ` in ${selectedCategory}`}
                </div>
              </div>
            )}
            {filtered.length === 0 && !q && selectedCategory !== 'all' && (
              <div className="text-center py-16 text-muted-foreground">
                <div className="text-lg font-medium mb-2">No products in this category</div>
                <div className="text-sm">No products found in {selectedCategory}</div>
              </div>
            )}
            {filtered.length === 0 && !q && selectedCategory === 'all' && data.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <div className="text-lg font-medium mb-2">No products available</div>
                <div className="text-sm">Please check back later or contact support</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}