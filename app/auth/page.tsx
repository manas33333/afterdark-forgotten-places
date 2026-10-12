'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowUpRight, LogIn, UserPlus } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
      }
      router.push('/explore');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md card p-6 border border-[#373b33] bg-[#10120d]">
        <h2 className="serif text-2xl mb-6">{mode === 'signin' ? 'Sign In' : 'Create Account'}</h2>
        {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs muted mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field w-full" required />
          </div>
          <div>
            <label className="block text-xs muted mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="field w-full" required />
          </div>
          <button type="submit" disabled={loading} className="btn w-full py-2 justify-center mt-2">
            {loading ? 'Processing...' : mode === 'signin' ? 'Access Index' : 'Register Account'}
            <ArrowUpRight size={14} className="ml-1" />
          </button>
        </form>
        <div className="mt-6 text-center text-xs">
          <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="text-[#c4d36b] hover:underline">
            {mode === 'signin' ? "Don't have an account? Sign up" : 'Already registered? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
