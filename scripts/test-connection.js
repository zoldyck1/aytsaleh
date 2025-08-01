import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 10)}...` : 'Not found');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Check if we can reach the auth endpoint
    console.log('\n📡 Testing Auth Service...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth Service Error:', authError.message);
    } else {
      console.log('✅ Auth Service: Accessible');
      console.log('Current Session:', session ? 'Active' : 'None');
    }

    // Test 2: Try to access any existing table or get schema info
    console.log('\n🗄️ Testing Database Access...');
    
    // This should work even if no tables exist
    const { data, error } = await supabase.rpc('version');
    
    if (error) {
      console.log('Database Error:', error.message);
      
      // Try alternative test - checking if we get a proper error response
      const { error: testError } = await supabase
        .from('non_existent_table')
        .select('*')
        .limit(1);
      
      if (testError && testError.code === 'PGRST116') {
        console.log('✅ Database: Accessible (table not found is expected)');
      } else if (testError) {
        console.error('❌ Database Error:', testError.message);
      }
    } else {
      console.log('✅ Database: Accessible');
      console.log('PostgreSQL Version:', data);
    }

  } catch (error) {
    console.error('❌ Connection Test Failed:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('💡 This might be a network connectivity issue or the Supabase project is not accessible.');
    }
  }
}

testConnection();
