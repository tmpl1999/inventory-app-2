/**
 * TypeScript interfaces representing the Supabase schema
 */

export interface Location {
  id: string;
  code: string;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  barcode: string | null;
  reorder_point: number;
  created_at: string;
}

export interface Batch {
  id: string;
  product_id: string;
  lot_number: string;
  expiry_date: string | null;
  created_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  batch_id: string | null;
  location_id: string;
  qty: number;
  direction: 'IN' | 'OUT' | 'TRANSFER';
  source: string | null;
  ref: string | null;
  created_at: string;
}

export interface StockLevel {
  product_id: string;
  location_id: string;
  batch_id: string | null;
  sku: string;
  name: string;
  loc_code: string;
  lot_number: string | null;
  qty_on_hand: number;
  reorder_point: number;
}

export type MovementDirection = 'IN' | 'OUT' | 'TRANSFER';
export type AlertType = 'LOW_STOCK' | 'CRITICAL_STOCK' | 'EXPIRING_BATCH' | 'DISCREPANCY';
export type AlertSeverity = 'info' | 'warning' | 'error';
export type UserRole = 'admin' | 'manager' | 'operator';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
}

/* --------------------------------- Alerts -------------------------------- */
export interface Alert {
  id: string;              // <-- already there
  product_id: string;      // <-- already there
  message: string;         // <-- already there
  created_at?: string;     // <-- already (maybe) there

  // 🔑  Add this line ↓↓↓
  alert_type?: string;     // e.g. "LOW_STOCK", "EXPIRED" …
}


export interface StockSummary {
  total_products: number;
  total_batches: number;
  total_locations: number;
  low_stock_items: number;
  expiring_batches: number;
  recent_movements: number;
}
