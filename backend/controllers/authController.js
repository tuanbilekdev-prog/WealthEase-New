import jwt from 'jsonwebtoken';
import { supabase, getServiceRoleClient } from '../config/supabaseClient.js';

// Helper function to ensure user exists in database
const ensureUserExists = async (userId, email, name, role = 'user') => {
  try {
    console.log(`🔍 Checking if user exists: ${userId} (${email})`);
    
    // Use service role client for operations that need to bypass RLS
    const adminClient = getServiceRoleClient();
    console.log(`🔑 Using admin client (service_role key) for database operations`);
    
    // Check if user exists
    const { data: existingUser, error: checkError } = await adminClient
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    // If user doesn't exist, create them
    if (checkError && checkError.code === 'PGRST116') {
      console.log(`📝 User not found, creating new user: ${email}`);
      
      const { data: newUser, error: insertError } = await adminClient
        .from('users')
        .insert({
          id: userId,
          email,
          name,
          role,
          theme: 'light',
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Failed to create user in database:', insertError);
        console.error('   Error code:', insertError.code);
        console.error('   Error message:', insertError.message);
        console.error('   Error details:', insertError.details);
        // Don't throw - user can still login, user will be created on first transaction
        return { success: false, error: insertError };
      } else {
        console.log(`✅ User created successfully in database: ${email} (ID: ${newUser?.id})`);
        return { success: true, user: newUser };
      }
    } else if (checkError) {
      console.error('❌ Error checking user:', checkError);
      console.error('   Error code:', checkError.code);
      console.error('   Error message:', checkError.message);
      return { success: false, error: checkError };
    } else {
      console.log(`✅ User already exists in database: ${email} (ID: ${existingUser?.id})`);
      return { success: true, user: existingUser };
    }
  } catch (error) {
    console.error('❌ Error ensuring user exists:', error);
    console.error('   Error stack:', error.stack);
    // Don't throw - allow login to continue
    return { success: false, error };
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // In a real app, you would verify credentials against a database
    // For now, we'll just create a JWT for any valid email/password
    // Extract name from email (before @) for display
    const nameFromEmail = email.split('@')[0];
    const userId = email; // Use email as userId
    const name = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
    const role = 'user';

    // Ensure user exists in Supabase database
    await ensureUserExists(userId, email, name, role);

    const token = jwt.sign(
      { 
        email: email,
        userId: userId,
        name: name,
        role: role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token: token,
      user: {
        email: email,
        name: name,
        role: role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const googleAuth = async (req, res) => {
  // This will be handled by passport middleware
};

export const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    
    // Ensure user exists in Supabase database
    await ensureUserExists(
      user.id,
      user.email,
      user.name || user.email.split('@')[0],
      'user'
    );
    
    // Generate JWT token for the user
    const token = jwt.sign(
      {
        email: user.email,
        userId: user.id,
        name: user.name || user.email.split('@')[0],
        role: 'user',
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard?token=${token}`);
  } catch (error) {
    console.error('Google callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login?error=authentication_failed`);
  }
};

