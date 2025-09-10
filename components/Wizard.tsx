'use client';
import { useState } from 'react';
import { Button } from './ui/Button';

interface WizardStep {
  title: string;
  content: React.ReactNode;
}

interface WizardProps {
  steps: WizardStep[];
}

export default function Wizard({ steps }: WizardProps) {
  const [i, setI] = useState(0);
  const next = () => setI(s => Math.min(s + 1, steps.length - 1));
  const back = () => setI(s => Math.max(s - 1, 0));
  
  return (
    <div className="grid">
      <div style={{ display: 'flex', gap: 12 }}>
        {steps.map((s, idx) => (
          <div 
            key={idx} 
            style={{ 
              padding: '6px 10px', 
              borderBottom: idx === i ? '2px solid #0f766e' : '2px solid transparent', 
              fontWeight: idx === i ? 700 : 500 
            }}
          >
            {idx + 1}. {s.title}
          </div>
        ))}
      </div>
      <div>{steps[i].content}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={back} disabled={i === 0} variant="ghost">
          Back
        </Button>
        <Button onClick={next} disabled={i === steps.length - 1}>
          Next
        </Button>
      </div>
    </div>
  );
}