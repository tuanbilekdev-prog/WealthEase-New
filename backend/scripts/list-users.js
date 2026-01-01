/**
 * Script untuk melihat semua users di Supabase
 * Usage: node scripts/list-users.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { supabase } from '../config/supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

async function listUsers() {
  try {
    console.log('\n🔍 Fetching users from Supabase...\n');

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching users:', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      console.error('   Error details:', error.details);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.log('📭 No users found in database.');
      console.log('\n💡 Tip: Try logging in to create a user, or use:');
      console.log('   node scripts/create-user-manual.js <email> <name>');
      process.exit(0);
    }

    console.log(`✅ Found ${users.length} user(s):\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'N/A'} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role || 'user'}`);
      console.log(`   Theme: ${user.theme || 'light'}`);
      console.log(`   Created: ${user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

listUsers();

