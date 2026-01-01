import { addExpenseEntry, calculateSummary } from './transactionController.js';

// Helper to get user_id from request
const getUserId = (req) => {
  return req.user?.userId || req.user?.email || req.user?.id || null;
};

export const decreaseBalance = async (req, res) => {
  try {
    const { amount, description, name, category, date } = req.body ?? {};
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }

    // Create expense transaction (this will auto-update balance via trigger)
    await addExpenseEntry({
      amount: numericAmount,
      description: description || 'Bill payment',
      name: name || 'Bill Payment',
      category: category || 'Bills',
      date,
      userId,
    });

    // Get updated summary
    const summary = await calculateSummary(userId);

    res.json({ success: true, balance: summary.balance, summary });
  } catch (error) {
    console.error('Decrease balance error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
