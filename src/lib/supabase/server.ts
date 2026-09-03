import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'https://dummy.supabase.co';
const supabaseUrl = url.startsWith('http') ? url : 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || 'dummy_secret_key';

export const supabaseServer = createClient(supabaseUrl, supabaseKey);
