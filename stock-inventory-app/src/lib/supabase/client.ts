import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://rvgusgmvnqklyxxhvutq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3VzZ212bnFrbHl4eGh2dXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwODA4MDYsImV4cCI6MjA2NjY1NjgwNn0.wqRZ9Hq0j2Z9sgB4nmtOWibf2FAeEQLvF0RiF51DXAQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For server components
export const createServerClient = () => {
  // Create a new Supabase client on the server for each request
  return createClient(supabaseUrl, supabaseAnonKey);
};