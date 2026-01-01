import { supabase } from '../config/supabaseClient.js';

const validCategories = ['utilities', 'subscription', 'rent', 'food', 'others'];

// Helper to get user_id from request
const getUserId = (req) => {
  return req.user?.userId || req.user?.email || req.user?.id || null;
};

export const createBill = async (req, res) => {
  try {
    const { billName, amount, dueDate, category, description } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!billName || billName.trim().length === 0) {
      return res.status(400).json({ error: 'billName is required' });
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }

    if (!dueDate || Number.isNaN(new Date(dueDate).getTime())) {
      return res.status(400).json({ error: 'dueDate is required and must be valid' });
    }

    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({ error: 'category must be one of utilities, subscription, rent, food, others' });
    }

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: 'description is required' });
    }

    // Insert bill to Supabase
    const { data, error } = await supabase
      .from('bills')
      .insert({
        user_id: userId,
        bill_name: billName.trim(),
        amount: numericAmount,
        due_date: new Date(dueDate).toISOString(),
        category,
        description: description.trim(),
        completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to create bill', details: error.message });
    }

    res.status(201).json({
      id: data.id,
      billName: data.bill_name,
      amount: data.amount,
      dueDate: data.due_date,
      category: data.category,
      description: data.description,
      completed: data.completed,
      created_at: data.created_at,
    });
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getActiveBills = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: 'Failed to fetch active bills' });
    }

    // Transform data to match frontend expectations
    const bills = (data || []).map(bill => ({
      id: bill.id,
      billName: bill.bill_name,
      amount: bill.amount,
      dueDate: bill.due_date,
      category: bill.category,
      description: bill.description,
      completed: bill.completed,
      created_at: bill.created_at,
    }));

    res.json(bills);
  } catch (error) {
    console.error('Get active bills error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCompletedBills = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: 'Failed to fetch completed bills' });
    }

    // Transform data to match frontend expectations
    const bills = (data || []).map(bill => ({
      id: bill.id,
      billName: bill.bill_name,
      amount: bill.amount,
      dueDate: bill.due_date,
      category: bill.category,
      description: bill.description,
      completed: bill.completed,
      created_at: bill.created_at,
    }));

    res.json(bills);
  } catch (error) {
    console.error('Get completed bills error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markBillAsCompleted = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // First, get the bill to check ownership and get amount
    const { data: bill, error: fetchError } = await supabase
      .from('bills')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    if (bill.completed) {
      return res.json({ success: true, amount: bill.amount, message: 'Bill already completed' });
    }

    // Update bill to completed
    const { data: updatedBill, error: updateError } = await supabase
      .from('bills')
      .update({
        completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return res.status(500).json({ error: 'Failed to update bill' });
    }

    res.json({ success: true, amount: updatedBill.amount });
  } catch (error) {
    console.error('Complete bill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
