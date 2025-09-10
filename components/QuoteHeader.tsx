import Image from 'next/image';

interface QuoteHeaderProps {
  quoteNumber?: string;
  createdAt: string;
  validUntil?: string;
  preparedBy?: string;
}

export default function QuoteHeader({ quoteNumber, createdAt, validUntil, preparedBy }: QuoteHeaderProps) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      borderBottom: '1px solid var(--border)', 
      paddingBottom: 12, 
      marginBottom: 12 
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Image src="/logo.svg" alt="Logo" width={42} height={42} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>QUOTE</div>
          <div style={{ color: '#64748b' }}>Quote #: {quoteNumber || '—'}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right', color: '#334155' }}>
        <div>Created: {new Date(createdAt).toLocaleDateString()}</div>
        <div>Valid Until: {validUntil ? new Date(validUntil).toLocaleDateString() : '—'}</div>
        <div>Quoted By: {preparedBy || '—'}</div>
      </div>
    </div>
  );
}