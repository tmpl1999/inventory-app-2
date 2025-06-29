import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { useState, useEffect, createContext, useContext, ReactNode, createElement } from 'react';
import { Batch, Location, Movement, Product, Alert } from '../types/schema';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = 'https://rvgusgmvnqklyxxhvutq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3VzZ212bnFrbHl4eGh2dXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwODA4MDYsImV4cCI6MjA2NjY1NjgwNn0.wqRZ9Hq0j2Z9sgB4nmtOWibf2FAeEQLvF0RiF51DXAQ';

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth context type
type AuthContextType = {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: string | null;
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
type AuthProviderProps = {
  children: ReactNode;
};

// Auth provider component
export function SupabaseAuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const value = {
    session,
    user,
    signIn,
    signUp,
    signOut,
    loading,
    error
  };

  return createElement(AuthContext.Provider, { value }, children);
}

// Hook to use auth context
export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}

// Base API class with common CRUD operations
class BaseApi<T extends { id?: string }> {
  protected client: SupabaseClient;
  protected tableName: string;

  constructor(tableName: string) {
    this.client = supabase;
    this.tableName = tableName;
  }

  async getAll(): Promise<T[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as T[];
  }

  async getById(id: string): Promise<T | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data as T;
  }

  async create(item: Partial<T>): Promise<T> {
    const { data, error } = await this.client
      .from(this.tableName)
      .insert([{ ...item, id: item.id || uuidv4() }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as T;
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as T;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}

// Products API
class ProductsApi extends BaseApi<Product> {
  constructor() {
    super('app_5pk7rd_products');
  }

  async updateStock(productId: string, quantity: number): Promise<Product> {
    const product = await this.getById(productId);
    if (!product) throw new Error('Product not found');

    const currentStock = product.total_stock || 0;
    return this.update(productId, { 
      total_stock: currentStock + quantity
    });
  }

  async getLowStockProducts(limit = 10): Promise<Product[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .lt('total_stock', this.client.raw('reorder_point'))
      .order('total_stock', { ascending: true })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data as Product[];
  }
}

// Locations API
class LocationsApi extends BaseApi<Location> {
  constructor() {
    super('app_5pk7rd_locations');
  }
}

// Batches API
class BatchesApi extends BaseApi<Batch> {
  constructor() {
    super('app_5pk7rd_batches');
  }

  async getByProduct(productId: string): Promise<Batch[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('product_id', productId)
      .order('expiry_date', { ascending: true });

    if (error) throw new Error(error.message);
    return data as Batch[];
  }

  async getByLocation(locationId: string): Promise<Batch[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('location_id', locationId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as Batch[];
  }

  async getExpiringBatches(daysThreshold = 30): Promise<Batch[]> {
    const today = new Date();
    const thresholdDate = new Date(today);
    thresholdDate.setDate(today.getDate() + daysThreshold);

    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .gt('expiry_date', today.toISOString())
      .lt('expiry_date', thresholdDate.toISOString())
      .gt('quantity', 0)
      .order('expiry_date', { ascending: true });

    if (error) throw new Error(error.message);
    return data as Batch[];
  }
}

// Movements API
class MovementsApi extends BaseApi<Movement> {
  constructor() {
    super('app_5pk7rd_movements');
  }

  async getByProduct(productId: string): Promise<Movement[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as Movement[];
  }

  async createMovement(movement: Partial<Movement>): Promise<Movement> {
    // Start a transaction to update both the movement and the product
    const { data, error } = await this.client
      .from(this.tableName)
      .insert([{ ...movement, id: uuidv4() }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    // Update the product stock
    await productsApi.updateStock(
      movement.product_id as string, 
      movement.movement_type === 'in' ? movement.quantity as number : -(movement.quantity as number)
    );
    
    return data as Movement;
  }
}

// Alerts API
class AlertsApi extends BaseApi<Alert> {
  constructor() {
    super('app_5pk7rd_alerts');
  }

  async getUnresolvedAlerts(): Promise<Alert[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as Alert[];
  }

  async resolveAlert(alertId: string): Promise<Alert> {
    return this.update(alertId, { 
      resolved: true, 
      resolved_at: new Date().toISOString() 
    });
  }
}

// Create API instances
export const productsApi = new ProductsApi();
export const locationsApi = new LocationsApi();
export const batchesApi = new BatchesApi();
export const movementsApi = new MovementsApi();
export const alertsApi = new AlertsApi();

// Function to generate alerts based on stock levels and expiry dates
export async function generateAlerts(): Promise<void> {
  try {
    // Call the edge function to generate alerts
    const { data, error } = await supabase.functions.invoke('app_5pk7rd_generate_alert', {});
    
    if (error) {
      throw new Error(`Error generating alerts: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error generating alerts:', error);
    throw error;
  }
}

// Function to check stock levels against reorder points
export async function checkStockLevel(): Promise<void> {
  try {
    // Call the edge function to check stock levels
    const { data, error } = await supabase.functions.invoke('app_5pk7rd_check_stock_levels', {});
    
    if (error) {
      throw new Error(`Error checking stock levels: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error checking stock levels:', error);
    throw error;
  }
}