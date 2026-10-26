import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://aidadxoqoxzvvxiqjyfp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_ADMc4g3d-CjEEf-NKNAIjA_uXI_6PvV';

let supabaseClient = null;

try {
  if (SUPABASE_URL && SUPABASE_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('[Supabase] Initialized client for:', SUPABASE_URL);
  }
} catch (err) {
  console.error('[Supabase] Initialization error:', err);
}

export const supabase = supabaseClient;
