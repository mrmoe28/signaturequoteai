import { money } from '@/lib/formatting';

export default function PriceTag({ value }: { value: number | null }) { 
  return <strong>{money(value)}</strong>; 
}