'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      // For OAuth providers like Google, we need to allow the redirect
      await signIn('google', {
        callbackUrl: '/dashboard'
      });
    } catch (error) {
      setError('An error occurred during sign in');
      setLoading(false);
    }
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/dashboard'
      });
      
      if (result?.error) {
        setError('Invalid email or password');
      } else if (result?.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      setError('An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid" style={{ maxWidth: 360, margin: '40px auto' }}>
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <Button 
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="mb-4"
      >
        {loading ? 'Signing in...' : 'Continue with Google'}
      </Button>
      
      <div className="text-center text-gray-500 mb-4">or</div>
      
      <form onSubmit={handleCredentialsSignIn} className="space-y-4">
        <Input
          placeholder="Email" 
          type="email"
          value={email} 
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Input
          placeholder="Password" 
          type="password" 
          value={password} 
          onChange={e => setPassword(e.target.value)}
          required
        />
        <Button 
          type="submit" 
          disabled={loading || !email || !password}
          className="w-full"
        >
          {loading ? 'Signing in...' : 'Continue'}
        </Button>
      </form>
      
      <div className="text-center mt-6 space-y-2">
        <a href="/auth/reset" className="text-blue-600 hover:underline block">
          Forgot password?
        </a>
        <a href="/auth/register" className="text-blue-600 hover:underline block">
          Create account
        </a>
      </div>
    </div>
  );
}