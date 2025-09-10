'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function Reset() {
  const [email, setEmail] = useState('');
  
  return (
    <div className="grid" style={{ maxWidth: 360, margin: '40px auto' }}>
      <h1>Reset password</h1>
      <Input
        placeholder="Email" 
        value={email} 
        onChange={e => setEmail(e.target.value)} 
      />
      <Button onClick={() => alert('Reset link stub')}>
        Send reset link
      </Button>
    </div>
  );
}