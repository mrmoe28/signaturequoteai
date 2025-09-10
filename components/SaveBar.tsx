import { Button } from './ui/Button';

interface SaveBarProps {
  onBack?: () => void;
  onNext?: () => void;
  disabledNext?: boolean;
  labelNext?: string;
}

export default function SaveBar({ onBack, onNext, disabledNext, labelNext = 'Next' }: SaveBarProps) {
  return (
    <div style={{ 
      position: 'sticky', 
      bottom: 0, 
      background: 'white', 
      borderTop: '1px solid var(--border)', 
      padding: '10px 0', 
      display: 'flex', 
      gap: 10, 
      justifyContent: 'flex-end' 
    }}>
      {onBack && <Button onClick={onBack} variant="ghost">Back</Button>}
      {onNext && <Button onClick={onNext} disabled={disabledNext}>{labelNext}</Button>}
    </div>
  );
}