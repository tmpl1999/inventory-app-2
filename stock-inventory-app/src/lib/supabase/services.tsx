'use client';

import {
  createClient,
  SupabaseClient,
  User,
  Session,
} from '@supabase/supabase-js';
import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import type { Database, Alert } from '@/types/schema';   // adjust the path if needed

/* ──────────────────────────────────────────────────────────────
   1.  Supabase client
   ────────────────────────────────────────────────────────────── */
export const supabase: SupabaseClient<Database> = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ──────────────────────────────────────────────────────────────
   2.  Auth context + hook
   ────────────────────────────────────────────────────────────── */
type AuthCtx = { user: User | null; session: Session | null; isLoading: boolean };
const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser]       = useState<User | null>(null);
  const [isLoading, setLoad]  = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoad(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s.session);
      setUser(s.session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useSupabaseAuth must be used inside provider');
  return ctx;
}

/* ──────────────────────────────────────────────────────────────
   3.  Tiny auth helper (used by <AuthForm>)
   ────────────────────────────────────────────────────────────── */
export const authApi = {
  signIn : (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),
  signOut: () => supabase.auth.signOut(),
};

/* ──────────────────────────────────────────────────────────────
   4.  Generic stubbed table API – enough for compile-time only
   ────────────────────────────────────────────────────────────── */
type Table = 'alerts' | 'products' | 'locations' | 'batches' | 'movements';

function makeApi<T>(name: Table) {
  return {
    list  : () => Promise.resolve([] as T[]),
    getAll: () => Promise.resolve([] as T[]), // alias used in many lists
    /* create stub now returns sane defaults so TS sees correct shape */
    create: (row?: Partial<T>) =>
      Promise.resolve(
        (row ?? { alert_type: 'GENERIC', resolved: false } as T)
      ),
    update: (id: string, row: Partial<T>) =>
      Promise.resolve({ id, ...row } as T),
    remove: (id: string) => Promise.resolve({ id } as T),
  };
}

/* strongly-typed stubs – adjust to real types later */
export const alertsApi    = makeApi<Alert>('alerts');
export const productsApi  = makeApi<Database['public']['Tables']['products']['Row']>('products');
export const locationsApi = makeApi<Database['public']['Tables']['locations']['Row']>('locations');
export const batchesApi   = makeApi<Database['public']['Tables']['batches']['Row']>('batches');
export const movementsApi = makeApi<Database['public']['Tables']['movements']['Row']>('movements');

/* ──────────────────────────────────────────────────────────────
   5.  Dashboard helpers – stubbed
   ────────────────────────────────────────────────────────────── */
export async function checkStockLevel()  { return Promise.resolve(); }
export async function generateAlerts()   { return Promise.resolve(); }
