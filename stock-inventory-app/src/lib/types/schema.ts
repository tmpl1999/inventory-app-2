/* =========================================================================
   Minimal type definitions used by the stubbed APIs.
   You can replace these with the full Supabase-generated types later
   (e.g. import { Database } from '@/lib/database.types').
   ======================================================================== */

export interface Alert {
  id: string;
  product_id: string;
  message: string;
  created_at?: string;

  /* newly added optional fields */
  alert_type?: string;   // e.g. 'LOW_STOCK', 'EXPIRED'
  resolved?: boolean;    // true = handled, false = needs attention
}

/* ----- other table row shapes can go here when you need them ----------- */
export interface Product   { id: string; name: string; /* ... */ }
export interface Location  { id: string; code: string; /* ... */ }
export interface Batch     { id: string; lot_number: string; /* ... */ }
export interface Movement  { id: string; product_id: string; qty: number }

/* ---------------------------------------------------------------------- */
/*  Fallback Database type so services.ts can parameterise the client.    */
/*  Swap this out for your real generated Database type when ready.      */
/* ---------------------------------------------------------------------- */
export interface Database {
  public: {
    Tables: {
      alerts:     { Row: Alert };
      products:   { Row: Product };
      locations:  { Row: Location };
      batches:    { Row: Batch };
      movements:  { Row: Movement };
    };
  };
}
