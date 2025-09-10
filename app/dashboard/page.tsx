export default function Dashboard() {
  return (
    <div className="grid">
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Dashboard</h1>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <a 
          href="/quotes/new" 
          style={{ 
            border: '1px solid var(--border)', 
            borderRadius: 12, 
            padding: 16, 
            display: 'block' 
          }}
        >
          New Quote
        </a>
        <a 
          href="/products" 
          style={{ 
            border: '1px solid var(--border)', 
            borderRadius: 12, 
            padding: 16, 
            display: 'block' 
          }}
        >
          Products
        </a>
      </div>
    </div>
  );
}