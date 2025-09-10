'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  return (
    <div className="grid" style={{ maxWidth: 360, margin: '40px auto' }}>
      <h1>Create account</h1>
      <Button onClick={() => alert('Google auth stub')}>
        Sign up with Google
      </Button>
      <div style={{ height: 10 }} />
      <Input
        placeholder="Email" 
        value={email} 
        onChange={e => setEmail(e.target.value)} 
      />
      <Input
        placeholder="Password" 
        type="password" 
        value={password} 
        onChange={e => setPassword(e.target.value)} 
      />
      <Button onClick={() => alert('Email/Password register stub')}>
        Create
      </Button>
      <a href="/auth/login">Already have an account?</a>
    </div>
  );
}