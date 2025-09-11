'use client';

import type { Quote, CompanySettings } from '@/lib/types';
import Image from 'next/image';
import { money } from '@/lib/formatting';

// Database quote type (from queries)
type DatabaseQuote = {
  id: string;
  number: string | null;
  createdAt: Date | null;
  validUntil: Date | null;
  preparedBy: string | null;
  leadTimeNote: string | null;
  discount: string | null;
  shipping: string | null;
  tax: string | null;
  subtotal: string;
  total: string;
  terms: string | null;
  customerCompany: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerShipTo: string | null;
  items: Array<{
    id: string;
    quoteId: string;
    productId: string;
    name: string;
    unitPrice: number;
    quantity: number;
    extended: number;
    notes: string | null;
  }>;
  customer: {
    company: string | undefined;
    name: string;
    email: string | undefined;
    phone: string | undefined;
    shipTo: string | undefined;
  };
};

type QuoteDocumentProps = {
  quote: Quote | DatabaseQuote;
  companySettings: CompanySettings | null;
  hideImages?: boolean;
};

function normalizeQuote(quote: Quote | DatabaseQuote): Quote {
  // If it's already a Quote type, return as is
  if ('customer' in quote && typeof quote.customer === 'object' && 'createdAt' in quote && typeof quote.createdAt === 'string') {
    return quote as Quote;
  }
  
  // Convert DatabaseQuote to Quote
  const dbQuote = quote as DatabaseQuote;
  return {
    id: dbQuote.id,
    number: dbQuote.number || undefined,
    createdAt: dbQuote.createdAt?.toISOString() || new Date().toISOString(),
    validUntil: dbQuote.validUntil?.toISOString(),
    preparedBy: dbQuote.preparedBy || undefined,
    leadTimeNote: dbQuote.leadTimeNote || undefined,
    discount: parseFloat(dbQuote.discount || '0'),
    shipping: parseFloat(dbQuote.shipping || '0'),
    tax: parseFloat(dbQuote.tax || '0'),
    subtotal: parseFloat(dbQuote.subtotal),
    total: parseFloat(dbQuote.total),
    terms: dbQuote.terms || undefined,
    customer: dbQuote.customer,
    items: dbQuote.items.map(item => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      extended: item.extended,
      notes: item.notes || undefined,
    })),
  };
}

export function QuoteDocument({ quote: rawQuote, companySettings, hideImages = false }: QuoteDocumentProps) {
  const quote = normalizeQuote(rawQuote);
  
  const validUntilText = quote.validUntil 
    ? new Date(quote.validUntil).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '30 days from receipt';

  const createdDate = new Date(quote.createdAt || new Date()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-white text-gray-900 font-sans max-w-4xl mx-auto p-5 text-sm leading-relaxed">
      {/* Header */}
      <div className="text-center border-b-2 border-teal-700 pb-5 mb-8">
        {companySettings?.companyLogo && !hideImages && (
          <div className="mb-2 mx-auto relative" style={{ height: '64px', width: '192px' }}>
            <Image 
              src={companySettings.companyLogo}
              alt={companySettings.companyName || 'Company logo'}
              fill
              sizes="192px"
              className="object-contain"
              unoptimized
            />
          </div>
        )}
        <div className="text-2xl font-bold text-teal-700 mb-1">
          {companySettings?.companyName || 'Signature QuoteCrawler'}
        </div>
        <div className="text-gray-500 text-sm">Professional Solar Equipment Solutions</div>
        {(companySettings?.companyAddress || companySettings?.companyPhone || companySettings?.companyEmail) && (
          <div className="mt-2 text-xs text-gray-500 leading-snug">
            {companySettings?.companyAddress && <div>{companySettings.companyAddress}</div>}
            {(companySettings?.companyCity && companySettings?.companyState && companySettings?.companyZip) && 
              <div>{companySettings.companyCity}, {companySettings.companyState} {companySettings.companyZip}</div>
            }
            {companySettings?.companyPhone && <div>{companySettings.companyPhone}</div>}
            {companySettings?.companyEmail && <div>{companySettings.companyEmail}</div>}
          </div>
        )}
      </div>

      {/* Quote Title */}
      <h1 className="quote-title text-3xl font-bold text-gray-800 my-5 text-center">
        QUOTE {quote.number || quote.id}
      </h1>

      {/* Quote Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
        <div>
          <h3 className="text-lg font-semibold text-teal-700 border-b border-gray-200 pb-1 mb-4">
            Quote Details
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Quote Number:</span>
              <span className="text-gray-600">{quote.number || quote.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Date Created:</span>
              <span className="text-gray-600">{createdDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Valid Until:</span>
              <span className="text-gray-600">{validUntilText}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Prepared By:</span>
              <span className="text-gray-600">{quote.preparedBy || 'Sales Team'}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-teal-700 border-b border-gray-200 pb-1 mb-4">
            Customer Information
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Name:</span>
              <span className="text-gray-600">{quote.customer.name}</span>
            </div>
            {quote.customer.company && (
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Company:</span>
                <span className="text-gray-600">{quote.customer.company}</span>
              </div>
            )}
            {quote.customer.email && (
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Email:</span>
                <span className="text-gray-600">{quote.customer.email}</span>
              </div>
            )}
            {quote.customer.phone && (
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Phone:</span>
                <span className="text-gray-600">{quote.customer.phone}</span>
              </div>
            )}
            {quote.customer.shipTo && (
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Ship To:</span>
                <span className="text-gray-600">{quote.customer.shipTo}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Validity Notice */}
      <div className="bg-yellow-50 border border-yellow-400 rounded p-4 my-5 text-center font-semibold text-yellow-800">
        This quote is valid until {validUntilText}
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse my-8 bg-white">
        <thead>
          <tr>
            <th className="bg-teal-700 text-white p-3 text-left font-semibold">Item</th>
            <th className="bg-teal-700 text-white p-3 text-center font-semibold">Qty</th>
            <th className="bg-teal-700 text-white p-3 text-right font-semibold">Unit Price</th>
            <th className="bg-teal-700 text-white p-3 text-right font-semibold">Extended</th>
          </tr>
        </thead>
        <tbody>
          {quote.items.map((item, index) => (
            <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="p-2 border-b border-gray-200">
                <strong>{item.name}</strong>
                {item.notes && (
                  <>
                    <br />
                    <small className="text-gray-500">{item.notes}</small>
                  </>
                )}
              </td>
              <td className="p-2 border-b border-gray-200 text-center">{item.quantity}</td>
              <td className="p-2 border-b border-gray-200 text-right">{money(item.unitPrice)}</td>
              <td className="p-2 border-b border-gray-200 text-right">{money(item.extended)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mt-8">
        <table className="w-80 border-collapse">
          <tbody>
            <tr>
              <td className="p-2 border-b border-gray-200 font-semibold text-gray-700">Subtotal:</td>
              <td className="p-2 border-b border-gray-200 text-right text-gray-600">{money(quote.subtotal)}</td>
            </tr>
            {(quote.discount || 0) > 0 && (
              <tr>
                <td className="p-2 border-b border-gray-200 font-semibold text-gray-700">Discount:</td>
                <td className="p-2 border-b border-gray-200 text-right text-gray-600">-{money(quote.discount)}</td>
              </tr>
            )}
            {(quote.shipping || 0) > 0 && (
              <tr>
                <td className="p-2 border-b border-gray-200 font-semibold text-gray-700">Shipping:</td>
                <td className="p-2 border-b border-gray-200 text-right text-gray-600">{money(quote.shipping)}</td>
              </tr>
            )}
            {(quote.tax || 0) > 0 && (
              <tr>
                <td className="p-2 border-b border-gray-200 font-semibold text-gray-700">Tax:</td>
                <td className="p-2 border-b border-gray-200 text-right text-gray-600">{money(quote.tax)}</td>
              </tr>
            )}
            <tr className="bg-teal-700 text-white">
              <td className="p-3 font-bold text-lg">TOTAL:</td>
              <td className="p-3 text-right font-bold text-lg">{money(quote.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Lead Time */}
      {quote.leadTimeNote && (
        <div className="mt-10 p-5 bg-gray-50 rounded">
          <h3 className="text-teal-700 font-semibold mb-2">Lead Time</h3>
          <p>{quote.leadTimeNote}</p>
        </div>
      )}

      {/* Terms */}
      {quote.terms && (
        <div className="mt-10 p-5 bg-gray-50 rounded">
          <h3 className="text-teal-700 font-semibold mb-2">Terms & Conditions</h3>
          <p>{quote.terms}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-10 pt-5 border-t border-gray-200 text-center text-xs text-gray-500">
        <p><strong>Signature QuoteCrawler</strong> | Professional Solar Equipment Solutions</p>
        <p>This quote was generated automatically. For questions, please contact our sales team.</p>
      </div>
    </div>
  );
}