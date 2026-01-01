import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// Validate Supabase URL before creating client
if (!supabaseUrl || supabaseUrl === 'your-supabase-url-here' || !supabaseUrl.startsWith('https://')) {
  console.error('❌ ERROR: Invalid SUPABASE_URL in .env file!');
  console.error('   Please set SUPABASE_URL to a valid Supabase project URL (e.g., https://xxxxx.supabase.co)');
  console.error('   Get your URL from: Supabase Dashboard → Settings → API → Project URL');
  process.exit(1);
}

if (!supabaseKey || supabaseKey === 'your-supabase-anon-key-here') {
  console.error('❌ ERROR: Invalid SUPABASE_ANON_KEY in .env file!');
  console.error('   Please set SUPABASE_ANON_KEY to your Supabase anon key');
  console.error('   Get your key from: Supabase Dashboard → Settings → API → Project API keys → anon public');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Service role client for admin operations (bypasses RLS)
// This should be used for backend operations that need to bypass RLS policies
let serviceRoleClient = null;

export const getServiceRoleClient = () => {
  if (serviceRoleClient) {
    return serviceRoleClient;
  }
  
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey || serviceRoleKey === 'your-service-role-key-here') {
    console.warn('⚠️  WARNING: SUPABASE_SERVICE_ROLE_KEY not set. Some operations may fail due to RLS policies.');
    console.warn('   For backend operations, you should use the service_role key to bypass RLS.');
    console.warn('   Get it from: Supabase Dashboard → Settings → API → Project API keys → service_role');
    // Fallback to anon key (will fail on RLS-protected operations)
    return supabase;
  }
  
  console.log('✅ Using service_role key for admin operations (bypasses RLS)');
  serviceRoleClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  return serviceRoleClient;
};

