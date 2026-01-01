import { getServiceRoleClient } from '../config/supabaseClient.js';

const getUserId = (req) => req.user?.userId || req.user?.email || req.user?.id || null;

const TABLES_TO_CLEAR = [
  'transactions',
  'bills',
  'balance',
  'ai_chat_history',
  'ai_chat_bill_history',
];

export const clearFinancialData = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const adminClient = getServiceRoleClient();
    const results = [];

    for (const table of TABLES_TO_CLEAR) {
      console.log(`🧹 [ClearData] Clearing table: ${table} for user ${userId}`);
      const { error } = await adminClient
        .from(table)
        .delete()
        .eq('user_id', userId);
      
      if (error && error.code !== 'PGRST116') {
        console.error(`❌ [ClearData] Failed deleting from ${table}:`, error);
        return res.status(500).json({
          error: 'Failed to clear financial data',
          details: error.message,
        });
      }
      
      console.log(`✅ [ClearData] Successfully cleared table: ${table}`);
      results.push({ table, status: 'cleared' });
    }

    return res.json({
      message: 'Semua data finansial berhasil dihapus.',
      tables: results,
    });
  } catch (error) {
    console.error('❌ [ClearData] Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
};


