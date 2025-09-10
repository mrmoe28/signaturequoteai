'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  return (
    <div className="grid" style={{ maxWidth: 360, margin: '40px auto' }}>
      <h1>Login</h1>
      <Button onClick={() => alert('Google auth stub')}>
        Continue with Google
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
      <Button onClick={() => alert('Email/Password auth stub')}>
        Continue
      </Button>
      <a href="/auth/reset">Forgot password?</a>
      <a href="/auth/register">Create account</a>
    </div>
  );
}