import { Table, THead, Th, TBody, Tr, Td } from './ui/Table';
import PriceTag from './PriceTag';

interface LineItem {
  name: string;
  unitPrice: number;
  qty: number;
  extended: number;
  notes?: string;
}

interface QuoteLineItemsTableProps {
  items: LineItem[];
}

export default function QuoteLineItemsTable({ items }: QuoteLineItemsTableProps) {
  return (
    <Table>
      <THead>
        <Th>Description</Th>
        <Th>Unit Price</Th>
        <Th>Qty</Th>
        <Th>Extended</Th>
      </THead>
      <TBody>
        {items.map((i, idx) => (
          <Tr key={idx}>
            <Td>
              <div style={{ fontWeight: 600 }}>{i.name}</div>
              {i.notes && (
                <div style={{ color: '#64748b', fontSize: 12 }}>{i.notes}</div>
              )}
            </Td>
            <Td>
              <PriceTag value={i.unitPrice} />
            </Td>
            <Td>{i.qty}</Td>
            <Td>
              <PriceTag value={i.extended} />
            </Td>
          </Tr>
        ))}
      </TBody>
    </Table>
  );
}