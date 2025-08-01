import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing (using anon key)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSupabaseConnection() {
  console.log('🔍 Checking Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('_').select('*').limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist" which is expected
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    return false;
  }
}

async function checkAdminsTable() {
  console.log('🔍 Checking admins table...');
  
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('id, email, name, role, is_active')
      .limit(1);
    
    if (error) {
      console.error('❌ Admins table error:', error.message);
      console.log('💡 The admins table may not exist or may have permission issues.');
      return false;
    }
    
    console.log('✅ Admins table exists and is accessible');
    console.log('📊 Sample data:', data);
    return true;
  } catch (error) {
    console.error('❌ Error checking admins table:', error.message);
    return false;
  }
}

async function createAdminUser() {
  console.log('👤 Creating initial admin user...');
  
  try {
    const { data, error } = await supabase
      .from('admins')
      .insert([
        {
          email: 'mohammed@jam3ia.com',
          name: 'Mohammed Admin',
          role: 'super_admin',
          is_active: true
        }
      ])
      .select();
    
    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        console.log('ℹ️ Admin user already exists');
        return true;
      }
      console.error('❌ Error creating admin user:', error.message);
      return false;
    }
    
    console.log('✅ Admin user created successfully:', data);
    return true;
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    return false;
  }
}

async function testAuthentication() {
  console.log('🔐 Testing authentication...');
  
  try {
    // Try to get the current session
    const { data: session, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Auth error:', error.message);
      return false;
    }
    
    console.log('✅ Authentication system is working');
    console.log('📱 Current session:', session.session ? 'Active' : 'No active session');
    return true;
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Supabase diagnostics...\n');
  
  const connectionOk = await checkSupabaseConnection();
  if (!connectionOk) {
    console.log('\n❌ Cannot proceed without a valid connection');
    return;
  }
  
  console.log('');
  const authOk = await testAuthentication();
  
  console.log('');
  const tableOk = await checkAdminsTable();
  
  if (!tableOk) {
    console.log('\n💡 To fix the admins table issue:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Open the SQL Editor');
    console.log('3. Run the SQL script from scripts/setup-database.sql');
    console.log('4. Make sure to create a user in Supabase Auth with email: mohammed@jam3ia.com');
  } else {
    console.log('');
    await createAdminUser();
  }
  
  console.log('\n📋 Summary:');
  console.log('Connection:', connectionOk ? '✅' : '❌');
  console.log('Authentication:', authOk ? '✅' : '❌');
  console.log('Admins Table:', tableOk ? '✅' : '❌');
  
  if (connectionOk && authOk && tableOk) {
    console.log('\n🎉 Everything looks good! Your Supabase setup should work now.');
  } else {
    console.log('\n⚠️ Some issues need to be resolved before the admin dashboard will work properly.');
  }
}

main().catch(console.error);
