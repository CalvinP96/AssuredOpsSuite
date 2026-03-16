import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY environment variables');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  { global: { fetch: (...args) => {
    if (!supabaseUrl || !supabaseAnonKey) {
      return Promise.reject(new Error('Supabase credentials not configured'));
    }
    return fetch(...args);
  }}}
);
