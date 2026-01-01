/**
 * Script untuk membuat user secara manual di Supabase
 * Usage: node scripts/create-user-manual.js <email> <name>
 * Example: node scripts/create-user-manual.js test@example.com "Test User"
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { supabase } from '../config/supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

async function createUser(email, name) {
  try {
    if (!email) {
      console.error('❌ Error: Email is required');
      console.log('Usage: node scripts/create-user-manual.js <email> <name>');
      process.exit(1);
    }

    const userId = email; // Use email as userId (same as login logic)
    const userName = name || email.split('@')[0];
    const role = 'user';

    console.log(`\n🔍 Checking if user exists: ${userId} (${email})`);

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (checkError && checkError.code === 'PGRST116') {
      // User doesn't exist, create them
      console.log(`📝 Creating new user: ${email}`);
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          name: userName,
          role,
          theme: 'light',
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Failed to create user:', insertError);
        console.error('   Error code:', insertError.code);
        console.error('   Error message:', insertError.message);
        console.error('   Error details:', insertError.details);
        process.exit(1);
      } else {
        console.log(`\n✅ User created successfully!`);
        console.log('   ID:', newUser.id);
        console.log('   Email:', newUser.email);
        console.log('   Name:', newUser.name);
        console.log('   Role:', newUser.role);
        console.log('   Theme:', newUser.theme);
        process.exit(0);
      }
    } else if (checkError) {
      console.error('❌ Error checking user:', checkError);
      process.exit(1);
    } else {
      console.log(`\n✅ User already exists:`);
      console.log('   ID:', existingUser.id);
      console.log('   Email:', existingUser.email);
      console.log('   Name:', existingUser.name);
      console.log('   Role:', existingUser.role);
      console.log('   Theme:', existingUser.theme);
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const email = args[0];
const name = args[1];

createUser(email, name);

