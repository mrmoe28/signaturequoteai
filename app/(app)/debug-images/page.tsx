'use client';
import { useState, useEffect } from 'react';

export default function DebugImagesPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products?active_only=true')
      .then(r => r.json())
      .then(result => {
        console.log('API Response:', result);
        if (result.success && result.data?.items) {
          setProducts(result.data.items.slice(0, 5)); // First 5 products
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Image Debug Page</h1>

      {products.map(product => (
        <div key={product.id} className="mb-8 border p-4">
          <h2 className="text-xl font-bold mb-2">{product.name}</h2>

          <div className="mb-4">
            <strong>Product ID:</strong> {product.id}
          </div>

          <div className="mb-4">
            <strong>Primary Image URL from API:</strong>
            <code className="block bg-gray-100 p-2 mt-1">{product.primaryImageUrl || 'null'}</code>
          </div>

          <div className="mb-4">
            <strong>Images Array:</strong>
            <pre className="bg-gray-100 p-2 mt-1 overflow-auto">
              {JSON.stringify(product.images, null, 2)}
            </pre>
          </div>

          {product.primaryImageUrl && (
            <div className="mb-4">
              <strong>Trying to load image:</strong>
              <div className="mt-2">
                <img
                  src={product.primaryImageUrl}
                  alt={product.name}
                  className="max-w-xs border-2 border-red-500"
                  onLoad={() => console.log('✅ Image loaded:', product.primaryImageUrl)}
                  onError={(e) => {
                    console.error('❌ Image failed to load:', product.primaryImageUrl);
                    console.error('Error event:', e);
                  }}
                />
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Check browser console for load/error messages
              </div>
            </div>
          )}

          {product.images && product.images.length > 0 && (
            <div>
              <strong>First image localPath:</strong>
              <div className="mt-2">
                <code className="block bg-gray-100 p-2">{product.images[0].localPath}</code>
                <img
                  src={product.images[0].localPath}
                  alt={`${product.name} - from images array`}
                  className="max-w-xs border-2 border-blue-500 mt-2"
                  onLoad={() => console.log('✅ Images[0] loaded:', product.images[0].localPath)}
                  onError={(e) => {
                    console.error('❌ Images[0] failed:', product.images[0].localPath);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
