import { getQuoteById, getCompanySettings } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { QuoteDocument } from '@/components/QuoteDocument';

type PageProps = {
  params: { id: string };
  searchParams: { format?: 'pdf' | 'print' };
};

export default async function QuoteViewPage({ params, searchParams }: PageProps) {
  const quote = await getQuoteById(params.id);
  const companySettings = await getCompanySettings();
  
  if (!quote) {
    notFound();
  }

  const isPrintMode = searchParams.format === 'print' || searchParams.format === 'pdf';

  return (
    <div style={isPrintMode ? { background: 'white', minHeight: '100vh', padding: '20px' } : {}}>
      {isPrintMode && (
        <style dangerouslySetInnerHTML={{__html: `
          @media screen {
            body { margin: 0; padding: 0; }
          }
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none !important; }
          }
        `}} />
      )}
      
      <QuoteDocument quote={quote} companySettings={companySettings} hideImages={isPrintMode} />
      
      {!isPrintMode && (
        <div 
          className="no-print"
          style={{
            position: 'fixed',
            top: '16px',
            right: '16px',
            display: 'flex',
            gap: '8px'
          }}
        >
          <a 
            href={`/quote-view/${params.id}?format=print`}
            target="_blank"
            style={{
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: 'white',
              borderRadius: '4px',
              textDecoration: 'none'
            }}
          >
            Print View
          </a>
          <a 
            href={`/api/quotes/${params.id}/pdf`}
            target="_blank"
            style={{
              padding: '8px 16px',
              backgroundColor: '#16a34a',
              color: 'white',
              borderRadius: '4px',
              textDecoration: 'none'
            }}
          >
            Download PDF
          </a>
        </div>
      )}
    </div>
  );
}