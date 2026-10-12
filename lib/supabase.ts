import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// The standard instance for client pages
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// The secure instance for server API modules that the error logs are looking for
export const createServerSupabase = () => createClient(supabaseUrl, supabaseAnonKey);
