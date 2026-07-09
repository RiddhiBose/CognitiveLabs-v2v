import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || supabaseUrl.trim() === '') {
  console.error(
    '[ElevateHer AI] VITE_SUPABASE_URL is not set. Please configure your .env file.',
  );
}

if (!supabaseAnonKey || supabaseAnonKey.trim() === '') {
  console.error(
    '[ElevateHer AI] VITE_SUPABASE_ANON_KEY is not set. Please configure your .env file.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
