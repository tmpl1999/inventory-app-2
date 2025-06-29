'use client';

import {
  createClient,
  SupabaseClient,
  User,
  Session,
} from '@supabase/supabase-js';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

/* ────────────────────────────
   1.  Supabase client & types
   ──────────────────────────── */

export type Database = /* ↙︎  remove this line if you already
  import your generated Database type */ any;

export const supabase: SupabaseClient<Database> = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ────────────────────────────
   2.  Tiny auth context helper
   ──────────────────────────── */

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
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
      (_evt, data) => {
        setSession(data.session);
        setUser(data.session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error('useSupabaseAuth must be used inside SupabaseAuthProvider');
  return ctx;
}

/* ────────────────────────────
   3.  Paper-thin “fake” APIs so
       every import resolves
   ──────────────────────────── */

/* authApi is enough for <AuthForm /> */
export const authApi = {
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),
  signOut: () => supabase.auth.signOut(),
};

/* generic table helper */
type Table = 'alerts' | 'products' | 'locations' | 'batches' | 'movements';

function makeApi<T>(name: Table) {
  /* swap stubs for real Supabase calls later */
  return {
    list: () => Promise.resolve([] as T[]),
    getAll: () => Promise.resolve([] as T[]), // alias for legacy calls
    create: (row?: Partial<T>) => Promise.resolve(row ?? ({} as T)),
    update: (id: string, row: Partial<T>) =>
      Promise.resolve({ id, ...row } as T),
    remove: (id: string) => Promise.resolve({ id } as T),
  };
}

/* strongly-typed placeholders — adjust `Database` paths if needed */
export const alertsApi = makeApi<
  Database['public']['Tables']['alerts']['Row']
>('alerts');

export const productsApi = makeApi<
  Database['public']['Tables']['products']['Row']
>('products');

export const locationsApi = makeApi<
  Database['public']['Tables']['locations']['Row']
>('locations');

export const batchesApi = makeApi<
  Database['public']['Tables']['batches']['Row']
>('batches');

export const movementsApi = makeApi<
  Database['public']['Tables']['movements']['Row']
>('movements');

/* ────────────────────────────
   4.  Dashboard helpers (stubs)
   ──────────────────────────── */

export async function checkStockLevel() {
  /* TODO: compute low-stock products */
  return Promise.resolve();
}

export async function generateAlerts() {
  /* TODO: insert rows in `alerts` */
  return Promise.resolve();
}
