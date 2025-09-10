import QuoteHeader from './QuoteHeader';
import CustomerCard from './CustomerCard';
import QuoteLineItemsTable from './QuoteLineItemsTable';
import TotalsCard from './TotalsCard';
import TermsBlock from './TermsBlock';
import { Card, CardContent } from '@/components/ui/Card';
import { computeTotals } from '@/lib/compute';
import { Quote } from '@/lib/types';
import { DEFAULT_TERMS } from '@/lib/constants';

interface QuotePreviewProps {
  quote: Quote;
}

export default function QuotePreview({ quote }: QuotePreviewProps) {
  const totals = computeTotals(quote.items, {
    discount: quote.discount,
    shipping: quote.shipping,
    tax: quote.tax
  });
  
  return (
    <Card className="max-w-4xl mx-auto">
      <CardContent className="p-8 space-y-6">
        <QuoteHeader 
          quoteNumber={quote.number || 'Q-' + Date.now()} 
          createdAt={quote.createdAt || new Date().toISOString()} 
          validUntil={quote.validUntil || undefined} 
          preparedBy={quote.preparedBy || 'Sales Team'} 
        />
        <CustomerCard 
          company={quote.customer.company}
          name={quote.customer.name}
          email={quote.customer.email}
          phone={quote.customer.phone}
          shipTo={quote.customer.shipTo}
        />
        <QuoteLineItemsTable items={quote.items} />
        <TotalsCard
          subtotal={totals.subtotal}
          discountPct={quote.discount || 0}
          discountAmt={totals.subtotal - (totals.subtotal * (1 - (quote.discount || 0) / 100))}
          shipping={quote.shipping || 0}
          taxPct={quote.tax || 0}
          taxAmt={0}
          total={totals.total}
        />
        <TermsBlock text={quote.terms || DEFAULT_TERMS} />
      </CardContent>
    </Card>
  );
}