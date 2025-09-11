import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from './ui/Table';
import Image from 'next/image';
import PriceTag from './PriceTag';

interface LineItem {
  name: string;
  unitPrice: number | null;
  quantity: number;
  extended: number;
  notes?: string;
  imageUrl?: string;
}

interface QuoteLineItemsTableProps {
  items: LineItem[];
}

export default function QuoteLineItemsTable({ items }: QuoteLineItemsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-left">Product</TableHead>
          <TableHead className="text-right">Unit Price</TableHead>
          <TableHead className="text-center">Qty</TableHead>
          <TableHead className="text-right">Extended</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((i, idx) => (
          <TableRow key={idx}>
            <TableCell>
              <div className="flex items-center space-x-3">
                {i.imageUrl && (
                  <div className="relative w-12 h-12">
                    <Image
                      src={i.imageUrl}
                      alt={i.name}
                      fill
                      sizes="48px"
                      className="object-cover rounded border"
                      unoptimized
                    />
                  </div>
                )}
                <div>
                  <div className="font-semibold">{i.name}</div>
                  {i.notes && (
                    <div className="text-xs text-muted-foreground mt-1">{i.notes}</div>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <PriceTag value={i.unitPrice} />
            </TableCell>
            <TableCell className="text-center">{i.quantity}</TableCell>
            <TableCell className="text-right">
              <PriceTag value={i.extended} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}