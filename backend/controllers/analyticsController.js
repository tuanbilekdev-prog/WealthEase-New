import { getServiceRoleClient } from '../config/supabaseClient.js';
import { calculateSummary } from './transactionController.js';

const getUserId = (req) => req.user?.userId || req.user?.email || req.user?.id || null;

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];

const clampPeriod = (value = '') => {
  const lower = value.toLowerCase();
  return PERIODS.includes(lower) ? lower : 'monthly';
};

const buildDateRange = (period) => {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);

  switch (period) {
    case 'daily':
      startDate.setDate(startDate.getDate() - 6);
      break;
    case 'weekly':
      startDate.setDate(startDate.getDate() - 7 * 7); // last 8 weeks
      break;
    case 'monthly':
      startDate.setMonth(startDate.getMonth() - 5); // last 6 months
      startDate.setDate(1);
      break;
    case 'yearly':
      startDate.setFullYear(startDate.getFullYear() - 4); // last 5 years
      startDate.setMonth(0, 1);
      break;
    default:
      break;
  }

  return { startDate, endDate };
};

const advanceDate = (date, period) => {
  const next = new Date(date);
  switch (period) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setDate(next.getDate() + 1);
  }
  return next;
};

const formatBucketLabel = (date, period) => {
  const formatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: period === 'yearly' ? 'numeric' : undefined,
  });

  switch (period) {
    case 'daily':
      return `${date.toLocaleDateString('id-ID', { weekday: 'short' })} ${formatter.format(date)}`;
    case 'weekly':
      return `Minggu ${formatter.format(date)}`;
    case 'monthly':
      return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    case 'yearly':
      return date.getFullYear().toString();
    default:
      return formatter.format(date);
  }
};

const createBuckets = (startDate, endDate, period) => {
  const buckets = [];
  let cursor = new Date(startDate);

  while (cursor <= endDate) {
    const bucketStart = new Date(cursor);
    const nextStart = advanceDate(bucketStart, period);
    const bucketEnd = new Date(nextStart.getTime() - 1);

    buckets.push({
      key: bucketStart.getTime(),
      label: formatBucketLabel(bucketStart, period),
      start: bucketStart,
      end: bucketEnd,
    });

    cursor = nextStart;
  }

  return buckets;
};

const getBalanceBeforeDate = async (client, userId, dateISO) => {
  const { data, error } = await client
    .from('transactions')
    .select('type, amount')
    .eq('user_id', userId)
    .lt('date', dateISO);

  if (error) {
    console.error('❌ [Analytics] Failed to get balance before date:', error);
    return 0;
  }

  return (data || []).reduce((acc, tx) => {
    const amount = Number(tx.amount) || 0;
    return tx.type === 'income' ? acc + amount : acc - amount;
  }, 0);
};

const buildLineChartData = (transactions, period, startDate, endDate, startingBalance = 0) => {
  const sorted = [...(transactions || [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const buckets = createBuckets(startDate, endDate, period);
  const data = [];
  let runningBalance = startingBalance;
  let txIndex = 0;

  buckets.forEach((bucket) => {
    let bucketIncome = 0;
    let bucketExpense = 0;

    while (txIndex < sorted.length) {
      const tx = sorted[txIndex];
      const txDate = new Date(tx.date);

      if (txDate < bucket.start) {
        txIndex += 1;
        continue;
      }

      if (txDate > bucket.end) {
        break;
      }

      const amount = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        bucketIncome += amount;
      } else {
        bucketExpense += amount;
      }

      txIndex += 1;
    }

    runningBalance += bucketIncome - bucketExpense;
    data.push({
      label: bucket.label,
      income: Number(bucketIncome.toFixed(2)),
      expense: Number(bucketExpense.toFixed(2)),
      balance: Number(runningBalance.toFixed(2)),
    });
  });

  return data;
};

const groupExpensesByCategory = (transactions) => {
  const groups = (transactions || []).reduce((acc, tx) => {
    if (tx.type !== 'expense') {
      return acc;
    }
    const category = tx.category || 'Other';
    const amount = Number(tx.amount) || 0;
    acc[category] = (acc[category] || 0) + amount;
    return acc;
  }, {});

  return Object.entries(groups).map(([category, amount]) => ({
    category,
    amount: Number(amount.toFixed(2)),
  }));
};

const buildPieChartData = (categoryTotals) =>
  categoryTotals.map((item) => ({
    name: item.category,
    value: item.amount,
  }));

const getBudgetData = (limit, used) => {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : Math.max(used * 1.2, 1000000);
  const remaining = Math.max(safeLimit - used, 0);
  return {
    limit: Number(safeLimit.toFixed(2)),
    used: Number(used.toFixed(2)),
    remaining: Number(remaining.toFixed(2)),
    data: [
      { name: 'Terpakai', value: Number(used.toFixed(2)) },
      { name: 'Sisa', value: Number(remaining.toFixed(2)) },
    ],
  };
};

const getUserCategories = async (client, userId) => {
  const { data, error } = await client
    .from('transactions')
    .select('category')
    .eq('user_id', userId);

  if (error) {
    console.error('❌ [Analytics] Failed to fetch categories:', error);
    return ['all'];
  }

  const categories = Array.from(
    new Set(
      (data || [])
        .map((item) => item.category)
        .filter(Boolean)
        .map((cat) => cat.trim())
    )
  ).sort((a, b) => a.localeCompare(b));

  return ['all', ...categories];
};

export const getAnalyticsSummary = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const period = clampPeriod(req.query.period);
    const categoryFilter = (req.query.category || 'all').toLowerCase();
    const requestedBudgetLimit = Number(req.query.budgetLimit);

    const { startDate, endDate } = buildDateRange(period);
    const adminClient = getServiceRoleClient();

    let query = adminClient
      .from('transactions')
      .select('id, amount, type, category, date, name')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString());

    if (categoryFilter && categoryFilter !== 'all') {
      query = query.ilike('category', categoryFilter);
    }

    const { data: transactions, error } = await query.order('date', { ascending: true });

    if (error) {
      console.error('❌ [Analytics] Failed to fetch transactions:', error);
      return res.status(500).json({ error: 'Failed to load analytics data' });
    }

    const summary = await calculateSummary(userId);
    const totals = (transactions || []).reduce(
      (acc, tx) => {
        const amount = Number(tx.amount) || 0;
        if (tx.type === 'income') {
          acc.income += amount;
        } else {
          acc.expense += amount;
        }
        return acc;
      },
      { income: 0, expense: 0 }
    );

    const spendingRate =
      totals.income > 0 ? Number(((totals.expense / totals.income) * 100).toFixed(2)) : 0;

    const categoryTotals = groupExpensesByCategory(transactions);
    const highestExpenseCategory = categoryTotals.reduce(
      (acc, item) => (item.amount > acc.amount ? item : acc),
      { category: '-', amount: 0 }
    );

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const { data: weekTransactions } = await adminClient
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgo.toISOString());

    const startingBalance = await getBalanceBeforeDate(
      adminClient,
      userId,
      startDate.toISOString()
    );

    const lineChart = buildLineChartData(
      transactions,
      period,
      startDate,
      endDate,
      startingBalance
    );

    const categories = await getUserCategories(adminClient, userId);

    const response = {
      stats: {
        currentBalance: Number(summary.balance || 0),
        totalIncome: Number(totals.income.toFixed(2)),
        totalExpense: Number(totals.expense.toFixed(2)),
        spendingRate,
        highestExpenseCategory,
        weeklyTransactionCount: weekTransactions?.length || 0,
        transactionCount: transactions?.length || 0,
      },
      charts: {
        balanceTrend: lineChart,
        expensesByCategory: categoryTotals,
        expenseComposition: buildPieChartData(categoryTotals),
        budgetUsage: getBudgetData(requestedBudgetLimit, totals.expense),
      },
      meta: {
        period,
        category: categoryFilter,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        categories,
      },
    };

    return res.json(response);
  } catch (error) {
    console.error('❌ [Analytics] Summary error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAnalyticsTransactions = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const period = clampPeriod(req.query.period);
    const categoryFilter = (req.query.category || 'all').toLowerCase();
    const sort = (req.query.sort || 'latest').toLowerCase();

    const { startDate, endDate } = buildDateRange(period);
    const adminClient = getServiceRoleClient();

    let query = adminClient
      .from('transactions')
      .select('id, name, type, amount, category, description, date')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString());

    if (categoryFilter && categoryFilter !== 'all') {
      query = query.ilike('category', categoryFilter);
    }

    if (sort === 'amount_highest') {
      query = query.order('amount', { ascending: false });
    } else if (sort === 'amount_lowest') {
      query = query.order('amount', { ascending: true });
    } else if (sort === 'oldest') {
      query = query.order('date', { ascending: true });
    } else {
      query = query.order('date', { ascending: false }); // latest
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ [Analytics] Transactions error:', error);
      return res.status(500).json({ error: 'Failed to load transactions' });
    }

    return res.json({
      transactions: data || [],
      meta: {
        count: data?.length || 0,
        period,
      },
    });
  } catch (error) {
    console.error('❌ [Analytics] Transactions endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


