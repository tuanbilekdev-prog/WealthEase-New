/**
 * Seed Dummy Data Script
 * 
 * This script creates dummy data for testing purposes.
 * Run with: node scripts/seed-dummy-data.js
 * 
 * Make sure to set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const TEST_USER_ID = 'test-user-1';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_NAME = 'Test User';

async function seedData() {
  console.log('🌱 Starting seed process...\n');

  try {
    // 1. Create test user
    console.log('1. Creating test user...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({
        id: TEST_USER_ID,
        name: TEST_USER_NAME,
        email: TEST_USER_EMAIL,
        role: 'user',
        theme: 'light',
      }, {
        onConflict: 'id',
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Error creating user:', userError);
      throw userError;
    }
    console.log('✅ User created:', user.email);

    // 2. Insert transactions
    console.log('\n2. Inserting transactions...');
    const transactions = [
      { type: 'income', amount: 5000000, name: 'Salary', category: 'Salary', description: 'Monthly salary payment', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
      { type: 'income', amount: 2000000, name: 'Freelance Project', category: 'Business', description: 'Web development project', date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
      { type: 'expense', amount: 500000, name: 'Grocery Shopping', category: 'Groceries', description: 'Weekly grocery shopping', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
      { type: 'expense', amount: 150000, name: 'Internet Bill', category: 'Utilities', description: 'Monthly internet subscription', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { type: 'expense', amount: 200000, name: 'Restaurant', category: 'Food & Drinks', description: 'Dinner with friends', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { type: 'income', amount: 1000000, name: 'Investment Return', category: 'Investment', description: 'Stock dividend', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    ];

    // Delete existing transactions for this user first
    await supabase.from('transactions').delete().eq('user_id', TEST_USER_ID);

    const { data: insertedTransactions, error: transError } = await supabase
      .from('transactions')
      .insert(transactions.map(t => ({ ...t, user_id: TEST_USER_ID })))
      .select();

    if (transError) {
      console.error('❌ Error inserting transactions:', transError);
      throw transError;
    }
    console.log(`✅ Inserted ${insertedTransactions.length} transactions`);

    // 3. Insert bills
    console.log('\n3. Inserting bills...');
    const bills = [
      { bill_name: 'Electricity Bill', amount: 300000, due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), category: 'utilities', description: 'Monthly electricity payment', completed: false },
      { bill_name: 'Netflix Subscription', amount: 149000, due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), category: 'subscription', description: 'Monthly streaming service', completed: false },
      { bill_name: 'Rent Payment', amount: 2000000, due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), category: 'rent', description: 'Monthly apartment rent', completed: false },
      { bill_name: 'Phone Bill', amount: 100000, due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), category: 'utilities', description: 'Monthly phone plan', completed: true },
      { bill_name: 'Gym Membership', amount: 200000, due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), category: 'subscription', description: 'Monthly gym fee', completed: true },
    ];

    // Delete existing bills for this user first
    await supabase.from('bills').delete().eq('user_id', TEST_USER_ID);

    const { data: insertedBills, error: billsError } = await supabase
      .from('bills')
      .insert(bills.map(b => ({ ...b, user_id: TEST_USER_ID })))
      .select();

    if (billsError) {
      console.error('❌ Error inserting bills:', billsError);
      throw billsError;
    }
    console.log(`✅ Inserted ${insertedBills.length} bills`);

    // 4. Check balance
    console.log('\n4. Checking balance...');
    const { data: balance, error: balanceError } = await supabase
      .from('balance')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .single();

    if (balanceError && balanceError.code !== 'PGRST116') {
      console.error('❌ Error checking balance:', balanceError);
    } else if (balance) {
      console.log('✅ Balance:', {
        current_balance: balance.current_balance,
        total_income: balance.total_income,
        total_expense: balance.total_expense,
      });
    } else {
      console.log('⚠️  Balance not yet calculated (will be updated by trigger)');
    }

    console.log('\n🎉 Seed process completed successfully!');
    console.log(`\n📝 Test user credentials:`);
    console.log(`   User ID: ${TEST_USER_ID}`);
    console.log(`   Email: ${TEST_USER_EMAIL}`);
    console.log(`\n💡 Use this user ID in your JWT token for testing.`);

  } catch (error) {
    console.error('\n❌ Seed process failed:', error);
    process.exit(1);
  }
}

seedData();

