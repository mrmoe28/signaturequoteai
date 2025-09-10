import { QuoteItem } from './types';

export function computeExtended(item: Omit<QuoteItem, 'extended'>): number {
  return +(item.unitPrice * item.qty).toFixed(2);
}

export function computeTotals(items: QuoteItem[], opts: { discount?: number; shipping?: number; tax?: number }) {
  const subtotal = +items.reduce((s, i) => s + i.extended, 0).toFixed(2);
  const discountAmt = opts.discount ? +(subtotal * (opts.discount / 100)).toFixed(2) : 0;
  const afterDisc = subtotal - discountAmt;
  const taxed = opts.tax ? +((afterDisc) * (opts.tax / 100)).toFixed(2) : 0;
  const total = +(afterDisc + (opts.shipping || 0) + taxed).toFixed(2);
  return { subtotal, discountAmt, taxed, total };
}