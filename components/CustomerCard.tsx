import { Card } from './ui/Card';

interface CustomerCardProps {
  company?: string;
  name?: string;
  email?: string;
  phone?: string;
  shipTo?: string;
}

export default function CustomerCard({ company, name, email, phone, shipTo }: CustomerCardProps) {
  return (
    <Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 600 }}>Prepared For</div>
          <div>{company || '—'}</div>
          <div>{name || '—'}</div>
          <div>{phone || '—'}</div>
          <div>{email || '—'}</div>
          <div>{shipTo || '—'}</div>
        </div>
      </div>
    </Card>
  );
}