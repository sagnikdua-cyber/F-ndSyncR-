import { createClient } from '@supabase/supabase-js';

let url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
if (!url.startsWith('http')) {
  url = 'https://dummy.supabase.co';
}
const supabaseUrl = url;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_anon_key';

export const supabase = createClient(supabaseUrl, supabaseKey);
