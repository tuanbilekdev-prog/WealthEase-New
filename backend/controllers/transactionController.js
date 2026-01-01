import { supabase, getServiceRoleClient } from '../config/supabaseClient.js';

const validateTransactionPayload = ({ type, amount, name, category, description, date }) => {
  if (!type || !['income', 'expense'].includes(type)) {
    return 'type must be income or expense';
  }

  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    return 'amount must be a positive number';
  }

  if (!name || name.trim().length === 0) {
    return 'transaction name is required';
  }

  if (!category || category.trim().length === 0) {
    return 'category is required';
  }

  if (!description || description.trim().length === 0) {
    return 'description is required';
  }

  if (date) {
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return 'date is invalid';
    }
  }

  return null;
};

// Helper to get user_id from request
const getUserId = (req) => {
  return req.user?.userId || req.user?.email || req.user?.id || null;
};

// Helper function to ensure user exists in database
const ensureUserExists = async (userId, email, name, role = 'user') => {
  try {
    console.log(`🔍 [Transaction] Checking if user exists: ${userId} (${email})`);
    
    // Use service role client for operations that need to bypass RLS
    const adminClient = getServiceRoleClient();
    console.log(`🔑 [Transaction] Using admin client (service_role key) for database operations`);
    
    // First, check if user exists by email (more reliable than ID)
    const { data: userByEmail, error: emailCheckError } = await adminClient
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single();

    // If user exists by email, verify ID matches
    if (userByEmail) {
      if (userByEmail.id === userId) {
        console.log(`✅ [Transaction] User exists with matching ID: ${userId}`);
        return; // User exists with correct ID
      } else {
        console.log(`⚠️ [Transaction] User exists with different ID. Email: ${email}, DB ID: ${userByEmail.id}, Request ID: ${userId}`);
        // User exists but with different ID - this is a data inconsistency issue
        // For now, we'll allow it and use the existing user's ID
        // In production, you might want to update the user's ID or handle this differently
        console.log(`✅ [Transaction] Using existing user ID: ${userByEmail.id}`);
        return; // Continue with existing user
      }
    }

    // If user doesn't exist by email, check by ID
    const { data: existingUser, error: checkError } = await adminClient
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();

    // If user exists by ID, return success
    if (existingUser) {
      console.log(`✅ [Transaction] User exists by ID: ${userId}`);
      return;
    }

    // If user doesn't exist (PGRST116 = no rows returned), create them
    if (checkError && checkError.code === 'PGRST116') {
      console.log(`📝 [Transaction] User not found, creating new user: ${email} (ID: ${userId})`);
      
      // Try to insert new user using service role client (bypasses RLS)
      const { data: newUser, error: insertError } = await adminClient
        .from('users')
        .insert({
          id: userId,
          email: email || userId,
          name: name || email?.split('@')[0] || 'User',
          role: role || 'user',
          theme: 'light',
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ [Transaction] Failed to create user in database:', insertError);
        console.error('   Error code:', insertError.code);
        console.error('   Error message:', insertError.message);
        console.error('   Error details:', insertError.details);
        console.error('   Error hint:', insertError.hint);
        
        // If it's a unique constraint violation, user might have been created by another request
        if (insertError.code === '23505') {
          console.log(`🔄 [Transaction] Unique constraint violation, checking if user now exists...`);
          
          // Re-check if user exists now (might have been created by concurrent request)
          const { data: recheckUser } = await adminClient
            .from('users')
            .select('id, email')
            .eq('email', email)
            .single();
          
          if (recheckUser) {
            console.log(`✅ [Transaction] User now exists (created by concurrent request): ${recheckUser.id}`);
            return; // User exists now, continue
          }
        }
        
        throw new Error(`User not found in database and failed to create user: ${insertError.message}`);
      }
      
      console.log(`✅ [Transaction] User created successfully: ${userId} (${email})`);
      return;
    } else if (checkError) {
      console.error('❌ [Transaction] Error checking user:', checkError);
      console.error('   Error code:', checkError.code);
      console.error('   Error message:', checkError.message);
      throw new Error(`Failed to verify user in database: ${checkError.message}`);
    }
  } catch (error) {
    console.error('❌ [Transaction] Error ensuring user exists:', error);
    throw error;
  }
};

export const addTransaction = async (req, res) => {
  try {
    const { type, amount, description, name, category, date } = req.body;
    const userId = getUserId(req);
    const email = req.user?.email || userId;
    const userName = req.user?.name || email?.split('@')[0] || 'User';
    const role = req.user?.role || 'user';

    console.log(`📝 [Transaction] Add transaction request:`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${userName}`);
    console.log(`   Role: ${role}`);
    console.log(`   Request user object:`, JSON.stringify(req.user, null, 2));

    if (!userId) {
      console.error('❌ [Transaction] No user ID found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Ensure user exists in database before inserting transaction
    try {
      await ensureUserExists(userId, email, userName, role);
    } catch (userError) {
      console.error('❌ [Transaction] User creation/verification error:', userError);
      console.error('   Error message:', userError.message);
      console.error('   Error stack:', userError.stack);
      return res.status(500).json({ 
        error: 'Failed to verify user account. Please try logging in again.',
        details: userError.message 
      });
    }

    const validationError = validateTransactionPayload({
      type,
      amount,
      name,
      category,
      description,
      date,
    });

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const parsedDate = date ? new Date(date) : new Date();

    // Insert transaction to Supabase
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type,
        amount: Number(amount),
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        date: parsedDate.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      
      // Handle specific error cases
      if (error.code === '23503') { // Foreign key violation
        return res.status(400).json({ 
          error: 'User account not found. Please try logging in again.',
          details: 'The user account does not exist in the database.'
        });
      }
      
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ 
          error: 'Transaction already exists.',
          details: error.message 
        });
      }

      return res.status(500).json({ 
        error: 'Failed to create transaction', 
        details: error.message 
      });
    }

    return res.status(201).json(data);
  } catch (error) {
    console.error('Add transaction error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRecentTransactions = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: 'Failed to fetch recent transactions' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Get recent transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const calculateSummary = async (userId) => {
  try {
    if (!userId) {
      return { total_income: 0, total_expense: 0, balance: 0 };
    }

    // Get balance from balance table (denormalized for performance)
    const { data: balanceData, error: balanceError } = await supabase
      .from('balance')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (balanceError && balanceError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Balance query error:', balanceError);
      // Fallback: calculate from transactions
      return await calculateSummaryFromTransactions(userId);
    }

    if (balanceData) {
      return {
        total_income: parseFloat(balanceData.total_income || 0),
        total_expense: parseFloat(balanceData.total_expense || 0),
        balance: parseFloat(balanceData.current_balance || 0),
      };
    }

    // If no balance record exists, calculate from transactions
    return await calculateSummaryFromTransactions(userId);
  } catch (error) {
    console.error('Calculate summary error:', error);
    return { total_income: 0, total_expense: 0, balance: 0 };
  }
};

// Helper to calculate summary from transactions (fallback)
const calculateSummaryFromTransactions = async (userId) => {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId);

    if (error) {
      console.error('Transaction query error:', error);
      return { total_income: 0, total_expense: 0, balance: 0 };
    }

    const summary = (transactions || []).reduce(
      (acc, transaction) => {
        const amount = parseFloat(transaction.amount || 0);
        if (transaction.type === 'income') {
          acc.total_income += amount;
        } else {
          acc.total_expense += amount;
        }
        return acc;
      },
      { total_income: 0, total_expense: 0, balance: 0 }
    );

    summary.balance = summary.total_income - summary.total_expense;
    return summary;
  } catch (error) {
    console.error('Calculate from transactions error:', error);
    return { total_income: 0, total_expense: 0, balance: 0 };
  }
};

export const getSummary = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const summary = await calculateSummary(userId);
    res.json(summary);
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addExpenseEntry = async ({ amount, description, name = 'Bill Payment', category = 'Bills', date, userId }) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const payload = {
      type: 'expense',
      amount,
      name,
      category,
      description: description || 'Auto deduction',
      date: date || new Date().toISOString(),
    };

    const validationError = validateTransactionPayload(payload);
    if (validationError) {
      throw new Error(validationError);
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'expense',
        amount: Number(amount),
        name: name.trim(),
        category: category.trim(),
        description: (description || 'Auto deduction').trim(),
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create expense: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Add expense entry error:', error);
    throw error;
  }
};
