'use client';

import { createClient, User, Session } from '@supabase/supabase-js';
import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import type { Database } from '../types/schema';          // adjust the path if your generated types live elsewhere

/* ------------------------------------------------------------------ */
/* 1️⃣  SINGLE SUPABASE CLIENT                                          */
/* ------------------------------------------------------------------ */
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ------------------------------------------------------------------ */
/* 2️⃣  LIGHTWEIGHT AUTH PROVIDER + HOOK                                */
/* ------------------------------------------------------------------ */
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser]       = useState<User | null>(null);
  const [isLoading, setLoad]  = useState(true);

  /* initial session + listener */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoad(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, data) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
    });

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
  if (!ctx) throw new Error('useSupabaseAuth must be used inside SupabaseAuthProvider');
  return ctx;
}

/* ------------------------------------------------------------------ */
/* 3️⃣  100-LINE “FAKE” APIs SO IMPORTS RESOLVE                         */
/*     Implement real DB logic later.                                 */
/* ------------------------------------------------------------------ */
export const authApi = {
  signIn : (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),
  signOut: () => supabase.auth.signOut(),
};

/* --------------- fake “table” APIs (enough to compile) ---------- */
type Table = 'alerts' | 'products' | 'locations' | 'batches' | 'movements';

function makeApi<T = unknown>(name: Table) {
  return {
    /** return an empty array – replace with real select(*) later */
    list:   () => Promise.resolve([] as T[]),

    /** alias so existing code compiling: AlertsList.tsx expects getAll() */
    getAll: () => Promise.resolve([] as T[]),

    /** noop create / update / delete */
    create: (row?: Partial<T>) => Promise.resolve(row ?? ({} as T)),
    update: (id: string, row: Partial<T>) => Promise.resolve({ id, ...row } as T),
    remove: (id: string) => Promise.resolve({ id } as T),
  };
}

export const alertsApi     = makeApi<'alerts'>('alerts');
export const productsApi   = makeApi<'products'>('products');
export const locationsApi  = makeApi<'locations'>('locations');
export const batchesApi    = makeApi<'batches'>('batches');
export const movementsApi  = makeApi<'movements'>('movements');


/* ------------------------------------------------------------------ */

