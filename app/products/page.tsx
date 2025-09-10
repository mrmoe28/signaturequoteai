'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import FreshnessBadge from '@/components/FreshnessBadge';
import { Product } from '@/lib/types';
import { money } from '@/lib/formatting';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');

  useEffect(() => {
    // Load products from API or static data
    fetch('/api/catalog')
      .then(r => r.json())
      .then(setProducts)
      .catch(() => {
        // Fallback sample data
        setProducts([
          {
            id: '1',
            name: 'Solar Panel 400W Monocrystalline',
            sku: 'SP-400M',
            vendor: 'SignatureSolar',
            category: 'Solar Panels',
            price: 199.99,
            currency: 'USD',
            unit: 'ea',
            lastUpdated: new Date().toISOString(),
            url: 'https://example.com/product1',
            images: [],
            isActive: true
          },
          {
            id: '2', 
            name: 'Lithium Battery 100Ah',
            sku: 'LB-100',
            vendor: 'SignatureSolar',
            category: 'Batteries',
            price: 899.99,
            currency: 'USD',
            unit: 'ea',
            lastUpdated: new Date(Date.now() - 24*60*60*1000).toISOString(),
            url: 'https://example.com/product2',
            images: [],
            isActive: true
          }
        ]);
      });
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesVendor = vendorFilter === 'all' || product.vendor === vendorFilter;
    
    return matchesSearch && matchesCategory && matchesVendor;
  });

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
  const vendors = Array.from(new Set(products.map(p => p.vendor)));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Product Catalog</h1>
        <p className="text-muted-foreground">
          Browse our current inventory with live pricing from Signature Solar
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Products</Label>
              <Input
                id="search"
                placeholder="Search by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="vendor">Vendor</Label>
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger id="vendor">
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map(vendor => (
                    <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setVendorFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="mb-6">
        <Badge variant="secondary" className="text-sm">
          {filteredProducts.length} products found
        </Badge>
        {searchQuery && (
          <Badge variant="outline" className="ml-2">
            Searching: &ldquo;{searchQuery}&rdquo;
          </Badge>
        )}
      </div>

      {/* Product Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow">
            {/* Product Image */}
            {(product.primaryImageUrl || (product.images && product.images.length > 0)) && (
              <div className="aspect-square overflow-hidden rounded-t-lg">
                <img
                  src={product.primaryImageUrl || product.images[0]?.localPath}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Hide image on error
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <Badge variant="outline">{product.vendor}</Badge>
              </div>
              {product.sku && (
                <div className="text-sm text-muted-foreground">
                  SKU: {product.sku}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {product.category && (
                    <Badge variant="secondary">{product.category}</Badge>
                  )}
                  <FreshnessBadge iso={product.lastUpdated} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-primary">
                    {money(product.price)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    per {product.unit}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button size="sm" className="flex-1">
                    Add to Quote
                  </Button>
                </div>

                {product.url && (
                  <div className="text-xs text-muted-foreground">
                    <a 
                      href={product.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      View on Signature Solar ↗
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              <p className="text-lg mb-2">No products found</p>
              <p>Try adjusting your search or filters</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}