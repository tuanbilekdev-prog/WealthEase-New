import { supabase } from '../config/supabaseClient.js';

// Helper to get user_id from request
const getUserId = (req) => {
  return req.user?.userId || req.user?.email || req.user?.id || null;
};

export const getCurrentUser = async (req, res) => {
  try {
    const tokenUser = req.user;

    if (!tokenUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = getUserId(req);
    const email = tokenUser.email || 'unknown@example.com';
    const name = tokenUser.name || email.split('@')[0];
    const role = tokenUser.role || 'user';

    // Try to get user from database
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is OK for new users
      console.error('Supabase query error:', error);
    }

    // If user exists in DB, use DB data; otherwise use token data
    const user = dbUser || {
      id: userId,
      email,
      name,
      role,
      theme: 'light',
    };

    // If user doesn't exist in DB, create them
    if (!dbUser) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          name,
          role,
          theme: 'light',
        });

      if (insertError) {
        console.error('Failed to create user:', insertError);
        // Continue anyway with token data
      }
    }

    // Get avatar selection and avatar_url from profiles table
    let avatarSelected = null
    let avatarUrl = null
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_selected, avatar_url')
        .eq('user_id', userId)
        .single()
      
      if (profile) {
        avatarSelected = profile.avatar_selected
        avatarUrl = profile.avatar_url
      }
    } catch (err) {
      // Profile might not exist yet, that's okay
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar_selected: avatarSelected,
      avatar_url: avatarUrl,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTheme = async (req, res) => {
  try {
    const { theme } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!theme || !['light', 'dark'].includes(theme)) {
      return res.status(400).json({ error: 'theme must be "light" or "dark"' });
    }

    // Update theme in database
    const { data, error } = await supabase
      .from('users')
      .update({
        theme,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      // If user doesn't exist, create them
      if (error.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: req.user?.email || 'unknown@example.com',
            name: req.user?.name || 'User',
            role: req.user?.role || 'user',
            theme,
          });

        if (insertError) {
          console.error('Failed to create user:', insertError);
          return res.status(500).json({ error: 'Failed to save theme' });
        }

        return res.json({ success: true, theme });
      }

      console.error('Supabase update error:', error);
      return res.status(500).json({ error: 'Failed to save theme' });
    }

    res.json({ success: true, theme: data.theme });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateAvatar = async (req, res) => {
  try {
    const { avatar_selected } = req.body;
    const userId = getUserId(req);

    console.log('Update avatar request:', { userId, avatar_selected });

    if (!userId) {
      console.error('No user ID found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate avatar_selected
    if (avatar_selected === undefined || avatar_selected === null) {
      return res.status(400).json({ error: 'avatar_selected is required' });
    }

    const avatarId = typeof avatar_selected === 'string' ? parseInt(avatar_selected, 10) : avatar_selected;
    
    if (isNaN(avatarId) || avatarId < 1 || avatarId > 12) {
      return res.status(400).json({ error: 'avatar_selected must be a number between 1 and 12' });
    }

    // Use service role client to bypass RLS
    const { getServiceRoleClient } = await import('../config/supabaseClient.js');
    const adminClient = getServiceRoleClient();

    if (!adminClient) {
      console.error('Failed to get service role client');
      return res.status(500).json({ error: 'Database connection error' });
    }

    // First, ensure profile exists
    const { data: existingProfile, error: checkError } = await adminClient
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    // If profile doesn't exist, create it first
    if (checkError && checkError.code === 'PGRST116') {
      console.log('Profile does not exist, creating...');
      const { error: createError } = await adminClient
        .from('profiles')
        .insert({
          user_id: userId,
          avatar_selected: avatarId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (createError) {
        console.error('Failed to create profile:', createError);
        return res.status(500).json({ 
          error: 'Failed to create profile',
          details: createError.message 
        });
      }

      return res.json({ success: true, avatar_selected: avatarId });
    }

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking profile:', checkError);
      return res.status(500).json({ 
        error: 'Database error',
        details: checkError.message 
      });
    }

    // Update existing profile
    const { data, error } = await adminClient
      .from('profiles')
      .update({
        avatar_selected: avatarId,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return res.status(500).json({ 
        error: 'Failed to save avatar selection',
        details: error.message,
        code: error.code 
      });
    }

    console.log('Avatar updated successfully:', data);
    res.json({ success: true, avatar_selected: data.avatar_selected });
  } catch (error) {
    console.error('Update avatar error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};
