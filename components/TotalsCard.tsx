import { money } from '@/lib/formatting';

interface TotalsCardProps {
  subtotal: number;
  discountPct?: number;
  discountAmt?: number;
  shipping?: number;
  taxPct?: number;
  taxAmt?: number;
  total: number;
}

export default function TotalsCard({ 
  subtotal, 
  discountPct = 0, 
  discountAmt = 0, 
  shipping = 0, 
  taxPct = 0, 
  taxAmt = 0, 
  total 
}: TotalsCardProps) {
  const Row = ({ label, value }: { label: string; value: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
      <div>{label}</div>
      <div>{value}</div>
    </div>
  );
  
  return (
    <div style={{ 
      border: '1px solid var(--border)', 
      borderRadius: 12, 
      padding: 16, 
      maxWidth: 420, 
      marginLeft: 'auto' 
    }}>
      <Row label="Subtotal" value={money(subtotal)} />
      <Row label={`Discount (${discountPct || 0}%)`} value={`-${money(discountAmt || 0)}`} />
      <Row label="Shipping" value={money(shipping || 0)} />
      <Row label={`Tax (${taxPct || 0}%)`} value={money(taxAmt || 0)} />
      <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
      <Row label="Total" value={money(total)} />
    </div>
  );
}