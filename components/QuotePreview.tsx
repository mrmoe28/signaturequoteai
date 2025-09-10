import QuoteHeader from './QuoteHeader';
import CustomerCard from './CustomerCard';
import QuoteLineItemsTable from './QuoteLineItemsTable';
import TotalsCard from './TotalsCard';
import TermsBlock from './TermsBlock';
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
    <div>
      <QuoteHeader 
        quoteNumber={quote.number} 
        createdAt={quote.createdAt} 
        validUntil={quote.validUntil} 
        preparedBy={quote.preparedBy} 
      />
      <CustomerCard />
      <div style={{ marginTop: 16 }} />
      <QuoteLineItemsTable items={quote.items} />
      <div style={{ marginTop: 16 }} />
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
    </div>
  );
}