'use client';
import ProductPicker from '@/components/ProductPicker';

export default function Products() {
  return (
    <div className="grid">
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Products</h1>
      <ProductPicker onAdd={(p) => alert(`Added ${p.name}`)} />
    </div>
  );
}