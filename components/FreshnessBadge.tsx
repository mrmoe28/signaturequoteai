import { Badge } from './ui/Badge';

export default function FreshnessBadge({ iso }: { iso: string }) {
  const d = new Date(iso);
  return (
    <Badge>
      Last updated: {d.toLocaleDateString()} {d.toLocaleTimeString()}
    </Badge>
  );
}