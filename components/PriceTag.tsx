import { money } from '@/lib/formatting';

export default function PriceTag({ value }: { value: number }) { 
  return <strong>{money(value)}</strong>; 
}