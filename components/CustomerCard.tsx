import { Card } from './ui/Card';

interface CustomerCardProps {
  company?: string;
  name?: string;
  email?: string;
  phone?: string;
  shipTo?: string;
}

export default function CustomerCard({ company, name, email, phone, shipTo }: CustomerCardProps) {
  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Prepared For</h3>
        <div className="space-y-2">
          {company && (
            <div>
              <span className="font-medium text-muted-foreground">Company:</span>
              <span className="ml-2">{company}</span>
            </div>
          )}
          {name && (
            <div>
              <span className="font-medium text-muted-foreground">Name:</span>
              <span className="ml-2">{name}</span>
            </div>
          )}
          {email && (
            <div>
              <span className="font-medium text-muted-foreground">Email:</span>
              <span className="ml-2">{email}</span>
            </div>
          )}
          {phone && (
            <div>
              <span className="font-medium text-muted-foreground">Phone:</span>
              <span className="ml-2">{phone}</span>
            </div>
          )}
          {shipTo && (
            <div>
              <span className="font-medium text-muted-foreground">Ship To:</span>
              <span className="ml-2">{shipTo}</span>
            </div>
          )}
          {!company && !name && !email && !phone && !shipTo && (
            <div className="text-muted-foreground italic">No customer information provided</div>
          )}
        </div>
      </div>
    </Card>
  );
}