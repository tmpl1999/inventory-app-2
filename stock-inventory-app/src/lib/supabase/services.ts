'use client';

import { createClient, User, Session } from '@supabase/supabase-js';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Database } from '../types/schema';   // adjust if your generated types live elsewhere

/* ---------- Single Supabase client ---------- */

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/* ---------- Lightweight Auth helper ---------- */

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/* ---------- “authApi” shim expected by old components ---------- */
// Keep the original import (`authApi`) working while you refactor.

export const authApi = {
  signInWithEmail: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),
  signOut: () => supabase.auth.signOut(),
};
