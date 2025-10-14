'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, ExternalLink, ShoppingCart } from 'lucide-react';
import { Product } from '@/lib/types';
import { money } from '@/lib/formatting';
import FreshnessBadge from '@/components/FreshnessBadge';

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        if (!params?.id) {
          setError('Invalid product ID');
          setLoading(false);
          return;
        }

        // Try to get from Signature Solar data first
        const signatureResponse = await fetch('/api/signature-solar');
        if (signatureResponse.ok) {
          const signatureData = await signatureResponse.json();
          const foundProduct = signatureData.find((p: Product) => p.id === params.id);
          if (foundProduct) {
            setProduct(foundProduct);
            setLoading(false);
            return;
          }
        }

        // Fallback to regular products API
        const response = await fetch(`/api/products/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
        } else {
          setError('Product not found');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      fetchProduct();
    }
  }, [params?.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading product details...</div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              <p className="text-lg mb-2">Product not found</p>
              <p>{error || 'The requested product could not be found.'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      {/* Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="space-y-4">
          {(product.primaryImageUrl || (product.images && product.images.length > 0)) && (
            <Card>
              <CardContent className="p-0">
                <div className="aspect-square overflow-hidden rounded-lg">
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
              </CardContent>
            </Card>
          )}

          {/* Additional Images */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1, 5).map((image, index) => (
                <div key={index} className="aspect-square overflow-hidden rounded-lg">
                  <img
                    src={image.url || "/images/placeholder.svg"}
                    alt={`${product.name} ${index + 2}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (img.src.endsWith("/images/placeholder.svg")) return;
                      img.src = "/images/placeholder.svg";
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold leading-tight">{product.name}</h1>
              <Badge variant="outline" className="shrink-0">{product.vendor}</Badge>
            </div>
            
            {product.sku && (
              <div className="text-sm text-muted-foreground mb-4">
                SKU: {product.sku}
              </div>
            )}

            <div className="flex items-center gap-2 mb-4">
              {product.category && (
                <Badge variant="secondary">{product.category}</Badge>
              )}
              <FreshnessBadge iso={product.lastUpdated} />
            </div>
          </div>

          {/* Price */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {money(product.price)}
                </div>
                {product.price != null && (
                  <div className="text-sm text-muted-foreground">
                    per {product.unit}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {product.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button size="lg" className="w-full">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Quote
            </Button>
            
            {product.url && (
              <Button variant="outline" size="lg" className="w-full" asChild>
                <a 
                  href={product.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Signature Solar
                </a>
              </Button>
            )}
          </div>

          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendor:</span>
                <span className="font-medium">{product.vendor}</span>
              </div>
              {product.category && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium">{product.category}</span>
                </div>
              )}
              {product.sku && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SKU:</span>
                  <span className="font-medium">{product.sku}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-medium">
                  {new Date(product.lastUpdated).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
