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
    <div className="w-full max-w-none">
      <div className="flex gap-8 mb-8">
        {steps.map((s, idx) => (
          <div 
            key={idx} 
            className={`px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
              idx === i 
                ? 'border-b-2 border-primary text-primary font-bold' 
                : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {idx + 1}. {s.title}
          </div>
        ))}
      </div>
      <div className="min-h-[60vh]">{steps[i].content}</div>
      <div className="flex justify-between mt-8 pt-6 border-t">
        <Button onClick={back} disabled={i === 0} variant="ghost" size="lg">
          Back
        </Button>
        {i < steps.length - 1 && (
          <Button onClick={next} size="lg">
            Next
          </Button>
        )}
      </div>
    </div>
  );
}