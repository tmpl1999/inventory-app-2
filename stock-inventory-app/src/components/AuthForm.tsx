'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase/services';
import { Input }   from '@/components/ui/input';
import { Button }  from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

/* ────────────────────────────────────────────────────────────── */
/*  Props                                                        */
/* ────────────────────────────────────────────────────────────── */
export type AuthFormProps = {
  /**
   * callback fired after a successful login / registration.
   * optional – pages that don’t care can omit it.
   */
  onSuccess?: () => void;
};

/* ────────────────────────────────────────────────────────────── */
/*  Component                                                    */
/* ────────────────────────────────────────────────────────────── */
export default function AuthForm({ onSuccess = () => {} }: AuthFormProps) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else {
      onSuccess();                     // ← safe even if caller omitted it
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Authentication failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />

      <Input
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
