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
    const fetchProducts = async () => {
      try {
        // Fetch products from database
        const response = await fetch('/api/products?active_only=true');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.items) {
            setProducts(result.data.items);
            return;
          }
        }

        // Fallback if database query fails
        if (!response.ok) {
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
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      }
    };

    fetchProducts();
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
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4">Product Catalog</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Browse our current inventory with live pricing from Signature Solar
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-4 md:mb-6">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-lg md:text-xl">Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search" className="text-sm font-medium">Search Products</Label>
              <Input
                id="search"
                placeholder="Search by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="category" className="text-sm font-medium">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category" className="mt-1">
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
              <Label htmlFor="vendor" className="text-sm font-medium">Vendor</Label>
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger id="vendor" className="mt-1">
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
                className="w-full md:w-auto h-10"
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
      <div className="mb-4 md:mb-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs md:text-sm">
            {filteredProducts.length} products found
          </Badge>
          {searchQuery && (
            <Badge variant="outline" className="text-xs md:text-sm">
              Searching: &ldquo;{searchQuery}&rdquo;
            </Badge>
          )}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredProducts.map(product => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow">
            {/* Product Image */}
            {(product.primaryImageUrl || (product.images && product.images.length > 0)) && (
              <div className="aspect-square overflow-hidden rounded-t-lg">
                <img
                  src={product.images?.[0]?.url || product.primaryImageUrl || "/images/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    if (img.src.endsWith("/images/placeholder.svg")) return;
                    img.src = "/images/placeholder.svg";
                  }}
                />
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base md:text-lg leading-tight">{product.name}</CardTitle>
                <Badge variant="outline" className="text-xs shrink-0">{product.vendor}</Badge>
              </div>
              {product.sku && (
                <div className="text-xs md:text-sm text-muted-foreground">
                  SKU: {product.sku}
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {product.category && (
                    <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                  )}
                  <FreshnessBadge iso={product.lastUpdated} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-lg md:text-2xl font-bold text-primary">
                    {money(product.price)}
                  </div>
                  {product.price != null && (
                    <div className="text-xs md:text-sm text-muted-foreground">
                      per {product.unit}
                    </div>
                  )}
                </div>

                <Button size="sm" className="w-full h-9 md:h-8 text-xs md:text-sm">
                  Add to Quote
                </Button>

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
          <CardContent className="text-center py-8 md:py-12">
            <div className="text-muted-foreground">
              <p className="text-base md:text-lg mb-2">No products found</p>
              <p className="text-sm md:text-base">Try adjusting your search or filters</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}