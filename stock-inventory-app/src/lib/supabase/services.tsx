/* -------- Auth hook / provider --------------------------------------- */

export const AuthContext = createContext<ReturnType<typeof useState> | null>(null);

export function useSupabaseAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useSupabaseAuth must be inside <SupabaseAuthProvider>');
  return ctx;
}

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [session, setSession]   = useState<Session | null>(null);
  const [isLoading, setLoading] = useState(true);

  /* minimal listener – you can improve later */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

/* -------- very thin “API” placeholders ------------------------------- */

type Table = 'products' | 'alerts' | 'batches' | 'locations' | 'movements';

function tableApi<T>(name: Table) {
  return {
    list:  () => supabase.from(name).select('*').then(r => r.data as T[]),
    get:   (id: string) => supabase.from(name).select('*').eq('id', id).single(),
    upsert:(row: Partial<T>) => supabase.from(name).upsert(row).single(),
    remove:(id: string) => supabase.from(name).delete().eq('id', id),
  };
}

export const productsApi  = tableApi<'products'>('products');
export const alertsApi    = tableApi<'alerts'>('alerts');
export const batchesApi   = tableApi<'batches'>('batches');
export const locationsApi = tableApi<'locations'>('locations');
export const movementsApi = tableApi<'movements'>('movements');

/* -------- stock-level helpers ---------------------------------------- */

export async function checkStockLevel(productId: string) {
  const [{ data: product }] = await Promise.all([
    supabase.from('products').select('total_stock').eq('id', productId).single(),
  ]);
  return product?.total_stock ?? 0;
}

export async function generateAlerts() {
  // naive demo – flag products at/below zero
  const { data: low } = await supabase
    .from('products')
    .select('*')
    .lte('total_stock', 0);

  for (const p of low ?? []) {
    await alertsApi.upsert({ product_id: p.id, alert_type: 'OUT_OF_STOCK' });
  }
}
