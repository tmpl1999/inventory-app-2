/* =========================================================================
   Minimal row-shape definitions used by the stubbed APIs.
   Swap these for your Supabase-generated types later.
   ========================================================================= */

export interface Alert {
  id: string;
  product_id: string;
  message: string;
  created_at?: string;
  alert_type?: string;  // e.g. 'LOW_STOCK'
  resolved?: boolean;
}

/* ------------------------------ Products ------------------------------- */
export interface Product {
  id: string;
  name: string;
  sku?: string;          // ← NEW: Stock-Keeping Unit code
  description?: string;
  created_at?: string;
}

/* ------------- Other tables (skeletons – expand later) ---------------- */
export interface Location  { id: string; code: string;  name?: string }
export interface Batch     { id: string; lot_number: string; product_id: string }
export interface Movement  { id: string; product_id: string; qty: number }

/* --------------- Fallback Database type for the stub client ----------- */
export interface Database {
  public: {
    Tables: {
      alerts:    { Row: Alert };
      products:  { Row: Product };
      locations: { Row: Location };
      batches:   { Row: Batch };
      movements: { Row: Movement };
    };
  };
}
