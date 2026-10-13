import { createClient, type SupabaseClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(
  url &&
  key &&
  !url.includes('YOUR_PROJECT_ID') &&
  !key.includes('YOUR_PUBLISHABLE_OR_ANON_KEY') &&
  !key.includes('YOUR_SUPABASE'),
);
export const supabase: SupabaseClient | null =
  isSupabaseConfigured && url && key ? createClient(url, key) : null;
