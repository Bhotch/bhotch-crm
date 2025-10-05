import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables not configured. Using Google Sheets fallback.');
}

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
}) : null;

// Health check function
export const checkSupabaseConnection = async () => {
  if (!supabase) {
    return false;
  }

  try {
    const { error } = await supabase.from('leads').select('count', { count: 'exact', head: true });
    return !error;
  } catch (err) {
    console.error('Supabase connection failed:', err);
    return false;
  }
};

// Check if Supabase is configured and enabled
export const isSupabaseEnabled = () => {
  return supabase !== null && supabaseUrl && supabaseAnonKey;
};
