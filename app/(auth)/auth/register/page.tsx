'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/dashboard'
      });
      
      if (result?.error) {
        setError('Failed to sign up with Google');
      } else if (result?.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      setError('An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Registration failed');
        return;
      }
      
      setSuccess(true);
      
      // Auto-sign in after successful registration
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/dashboard'
      });
      
      if (signInResult?.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      setError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="grid" style={{ maxWidth: 360, margin: '40px auto' }}>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Account created successfully! Signing you in...
        </div>
      </div>
    );
  }

  return (
    <div className="grid" style={{ maxWidth: 360, margin: '40px auto' }}>
      <h1 className="text-2xl font-bold mb-6">Create account</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <Button 
        onClick={handleGoogleSignUp}
        disabled={loading}
        className="mb-4"
      >
        {loading ? 'Signing up...' : 'Sign up with Google'}
      </Button>
      
      <div className="text-center text-gray-500 mb-4">or</div>
      
      <form onSubmit={handleCredentialsSignUp} className="space-y-4">
        <Input
          placeholder="Full Name" 
          type="text"
          value={name} 
          onChange={e => setName(e.target.value)}
          required
        />
        <Input
          placeholder="Email" 
          type="email"
          value={email} 
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Input
          placeholder="Password (min 6 characters)" 
          type="password" 
          value={password} 
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <Button 
          type="submit" 
          disabled={loading || !name || !email || !password}
          className="w-full"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
      
      <div className="text-center mt-6">
        <a href="/auth/login" className="text-blue-600 hover:underline">
          Already have an account? Sign in
        </a>
      </div>
      
      <div className="text-xs text-gray-500 mt-4 text-center">
        Free tier includes 3 quotes. Upgrade anytime for unlimited access.
      </div>
    </div>
  );
}