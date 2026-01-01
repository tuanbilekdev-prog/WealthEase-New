import { openai } from '../config/openaiClient.js';
import { getServiceRoleClient } from '../config/supabaseClient.js';

// Helper to get user_id from request
const getUserId = (req) => {
  return req.user?.userId || req.user?.email || req.user?.id || null;
};

// Helper to calculate date range based on period
const getDateRange = (period) => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - 6); // Get last 6 months of data for better accuracy
  
  if (period === 'weekly') {
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 7); // Next 7 days
    return { startDate, endDate, forecastDays: 7 };
  } else {
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 1); // Next month
    return { startDate, endDate, forecastDays: 30 };
  }
};

// Helper to calculate statistical metrics
const calculateStatistics = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return {
      avgDailyIncome: 0,
      avgDailyExpense: 0,
      incomeStdDev: 0,
      expenseStdDev: 0,
      incomeTrend: 0,
      expenseTrend: 0,
      categoryPatterns: {},
      weeklyPattern: {}
    };
  }

  // Group by date and type
  const dailyData = {};
  transactions.forEach(tx => {
    const date = new Date(tx.date).toISOString().split('T')[0];
    if (!dailyData[date]) {
      dailyData[date] = { income: 0, expense: 0, transactions: [] };
    }
    if (tx.type === 'income') {
      dailyData[date].income += Number(tx.amount || 0);
    } else {
      dailyData[date].expense += Number(tx.amount || 0);
    }
    dailyData[date].transactions.push(tx);
  });

  // Calculate averages
  const dates = Object.keys(dailyData).sort();
  const dailyIncomes = dates.map(d => dailyData[d].income);
  const dailyExpenses = dates.map(d => dailyData[d].expense);
  
  const avgDailyIncome = dailyIncomes.reduce((a, b) => a + b, 0) / (dates.length || 1);
  const avgDailyExpense = dailyExpenses.reduce((a, b) => a + b, 0) / (dates.length || 1);

  // Calculate standard deviation
  const incomeVariance = dailyIncomes.reduce((sum, val) => sum + Math.pow(val - avgDailyIncome, 2), 0) / (dates.length || 1);
  const expenseVariance = dailyExpenses.reduce((sum, val) => sum + Math.pow(val - avgDailyExpense, 2), 0) / (dates.length || 1);
  const incomeStdDev = Math.sqrt(incomeVariance);
  const expenseStdDev = Math.sqrt(expenseVariance);

  // Calculate trend (slope of linear regression)
  const n = dates.length;
  let incomeTrend = 0;
  let expenseTrend = 0;
  if (n > 1) {
    const sumX = (n * (n - 1)) / 2;
    const sumYIncome = dailyIncomes.reduce((a, b, i) => a + b * i, 0);
    const sumYExpense = dailyExpenses.reduce((a, b, i) => a + b * i, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    incomeTrend = (n * sumYIncome - sumX * dailyIncomes.reduce((a, b) => a + b, 0)) / (n * sumX2 - sumX * sumX);
    expenseTrend = (n * sumYExpense - sumX * dailyExpenses.reduce((a, b) => a + b, 0)) / (n * sumX2 - sumX * sumX);
  }

  // Analyze category patterns
  const categoryPatterns = {};
  transactions.forEach(tx => {
    if (tx.type === 'expense' && tx.category) {
      if (!categoryPatterns[tx.category]) {
        categoryPatterns[tx.category] = { total: 0, count: 0, avg: 0 };
      }
      categoryPatterns[tx.category].total += Number(tx.amount || 0);
      categoryPatterns[tx.category].count += 1;
    }
  });
  Object.keys(categoryPatterns).forEach(cat => {
    categoryPatterns[cat].avg = categoryPatterns[cat].total / categoryPatterns[cat].count;
  });

  // Analyze weekly patterns (Monday=0, Sunday=6)
  const weeklyPattern = { income: {}, expense: {} };
  transactions.forEach(tx => {
    const date = new Date(tx.date);
    const dayOfWeek = date.getDay();
    const type = tx.type;
    if (!weeklyPattern[type][dayOfWeek]) {
      weeklyPattern[type][dayOfWeek] = { total: 0, count: 0 };
    }
    weeklyPattern[type][dayOfWeek].total += Number(tx.amount || 0);
    weeklyPattern[type][dayOfWeek].count += 1;
  });

  return {
    avgDailyIncome,
    avgDailyExpense,
    incomeStdDev,
    expenseStdDev,
    incomeTrend,
    expenseTrend,
    categoryPatterns,
    weeklyPattern,
    totalDays: dates.length
  };
};

export const generateForecast = async (req, res) => {
  try {
    const { period = 'monthly' } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!['weekly', 'monthly'].includes(period)) {
      return res.status(400).json({ error: 'period must be "weekly" or "monthly"' });
    }

    if (!openai) {
      return res.status(500).json({ 
        error: 'AI service is not available. Please configure OPENAI_API_KEY in backend/.env' 
      });
    }

    console.log(`🔮 [AI Forecast] Generating forecast for user ${userId}, period: ${period}`);

    const adminClient = getServiceRoleClient();
    const { startDate, endDate, forecastDays } = getDateRange(period);

    // Get user's financial data
    // 1. Get transactions summary (last 3 months)
    const { data: transactions, error: transactionsError } = await adminClient
      .from('transactions')
      .select('type, amount, date, category, name')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: false });

    if (transactionsError) {
      console.error('❌ [AI Forecast] Error fetching transactions:', transactionsError);
      return res.status(500).json({ error: 'Failed to fetch transactions data' });
    }

    // 2. Get current balance
    const { data: balanceData, error: balanceError } = await adminClient
      .from('balance')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (balanceError && balanceError.code !== 'PGRST116') {
      console.error('❌ [AI Forecast] Error fetching balance:', balanceError);
    }

    const currentBalance = balanceData?.balance || 0;

    // 3. Get upcoming bills
    const { data: bills, error: billsError } = await adminClient
      .from('bills')
      .select('bill_name, amount, due_date, category, completed')
      .eq('user_id', userId)
      .eq('completed', false)
      .gte('due_date', new Date().toISOString())
      .order('due_date', { ascending: true })
      .limit(10);

    if (billsError) {
      console.error('❌ [AI Forecast] Error fetching bills:', billsError);
    }

    // Calculate comprehensive statistics from transactions
    const stats = calculateStatistics(transactions || []);
    
    const totalIncome = transactions
      ?.filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0) || 0;

    const totalExpense = transactions
      ?.filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0) || 0;

    // Calculate monthly averages (last 6 months divided by number of months)
    const monthsOfData = Math.max(1, stats.totalDays / 30);
    const avgMonthlyIncome = totalIncome / monthsOfData;
    const avgMonthlyExpense = totalExpense / monthsOfData;
    
    // Detect income pattern (salary cycle)
    const incomeTransactions = transactions?.filter(tx => tx.type === 'income') || [];
    const incomeDates = incomeTransactions.map(tx => new Date(tx.date).getDate()).sort((a, b) => a - b);
    let incomeCycle = 'irregular';
    if (incomeDates.length >= 2) {
      const avgDay = incomeDates.reduce((a, b) => a + b, 0) / incomeDates.length;
      if (avgDay >= 25 || avgDay <= 5) {
        incomeCycle = 'end_of_month'; // End of month salary
      } else if (avgDay >= 10 && avgDay <= 15) {
        incomeCycle = 'mid_month'; // Mid month salary
      }
    }

    // Calculate upcoming bills total
    const upcomingBillsTotal = bills
      ?.filter(bill => !bill.completed)
      .reduce((sum, bill) => sum + Number(bill.amount || 0), 0) || 0;

    // Build comprehensive prompt for OpenAI with detailed analysis
    const prompt = `You are an expert financial forecasting AI for WealthEase app. Analyze the following comprehensive financial data and provide accurate predictions. ALL RESPONSES MUST BE IN BAHASA INDONESIA.

═══════════════════════════════════════════════════════════════
USER FINANCIAL DATA - CURRENT STATUS
═══════════════════════════════════════════════════════════════
- Current Balance: Rp ${currentBalance.toLocaleString('id-ID')}
- Forecast Period: ${period === 'weekly' ? 'Next 7 days' : 'Next 30 days (1 month)'}
- Historical Data Period: Last ${Math.round(stats.totalDays)} days (${monthsOfData.toFixed(1)} months)

═══════════════════════════════════════════════════════════════
INCOME ANALYSIS (Based on ${stats.totalDays} days of data)
═══════════════════════════════════════════════════════════════
- Average Monthly Income: Rp ${avgMonthlyIncome.toLocaleString('id-ID')}
- Average Daily Income: Rp ${stats.avgDailyIncome.toLocaleString('id-ID')}
- Income Standard Deviation: Rp ${stats.incomeStdDev.toLocaleString('id-ID')} (lower = more consistent)
- Income Trend: ${stats.incomeTrend > 0 ? 'Meningkat' : stats.incomeTrend < 0 ? 'Menurun' : 'Stabil'} (${stats.incomeTrend > 0 ? '+' : ''}${stats.incomeTrend.toFixed(0)} per day)
- Income Pattern: ${incomeCycle === 'end_of_month' ? 'Gaji akhir bulan' : incomeCycle === 'mid_month' ? 'Gaji pertengahan bulan' : 'Tidak teratur'}

═══════════════════════════════════════════════════════════════
EXPENSE ANALYSIS
═══════════════════════════════════════════════════════════════
- Average Monthly Expense: Rp ${avgMonthlyExpense.toLocaleString('id-ID')}
- Average Daily Expense: Rp ${stats.avgDailyExpense.toLocaleString('id-ID')}
- Expense Standard Deviation: Rp ${stats.expenseStdDev.toLocaleString('id-ID')} (lower = more predictable)
- Expense Trend: ${stats.expenseTrend > 0 ? 'Meningkat' : stats.expenseTrend < 0 ? 'Menurun' : 'Stabil'} (${stats.expenseTrend > 0 ? '+' : ''}${stats.expenseTrend.toFixed(0)} per day)
- Net Daily Flow: Rp ${(stats.avgDailyIncome - stats.avgDailyExpense).toLocaleString('id-ID')} (positive = saving, negative = deficit)

═══════════════════════════════════════════════════════════════
EXPENSE BY CATEGORY (Top Categories)
═══════════════════════════════════════════════════════════════
${Object.entries(stats.categoryPatterns)
  .sort((a, b) => b[1].total - a[1].total)
  .slice(0, 5)
  .map(([cat, data]) => `- ${cat}: Avg Rp ${data.avg.toLocaleString('id-ID')} per transaction, ${data.count} transactions`)
  .join('\n') || 'No category data'}

═══════════════════════════════════════════════════════════════
UPCOMING BILLS (Must be factored into forecast)
═══════════════════════════════════════════════════════════════
Total Upcoming Bills: ${bills?.length || 0} bills, Total Amount: Rp ${upcomingBillsTotal.toLocaleString('id-ID')}

${bills?.slice(0, 10).map((bill, idx) => {
  const dueDate = new Date(bill.due_date);
  const today = new Date();
  const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
  return `${idx + 1}. ${bill.bill_name} (${bill.category}): Rp ${Number(bill.amount).toLocaleString('id-ID')} - Due in ${daysUntilDue} days (${dueDate.toLocaleDateString('id-ID')})`;
}).join('\n') || 'No upcoming bills'}

═══════════════════════════════════════════════════════════════
RECENT TRANSACTIONS (Last 15 for pattern recognition)
═══════════════════════════════════════════════════════════════
${transactions?.slice(0, 15).map((tx, idx) => {
  const date = new Date(tx.date);
  return `${idx + 1}. [${date.toLocaleDateString('id-ID')}] ${tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}: ${tx.name} (${tx.category}) - Rp ${Number(tx.amount).toLocaleString('id-ID')}`;
}).join('\n') || 'No recent transactions'}

═══════════════════════════════════════════════════════════════
FORECASTING TASK - CRITICAL REQUIREMENTS
═══════════════════════════════════════════════════════════════

1. PREDICT BALANCE FOR EACH DAY (Next ${forecastDays} days):
   - Start from current balance: Rp ${currentBalance.toLocaleString('id-ID')}
   - Account for daily income based on pattern: ${incomeCycle === 'end_of_month' ? 'Income likely at month end' : incomeCycle === 'mid_month' ? 'Income likely mid-month' : 'Distribute income based on average'}
   - Apply daily expenses based on average: Rp ${stats.avgDailyExpense.toLocaleString('id-ID')}/day
   - Apply expense trend: ${stats.expenseTrend > 0 ? 'Gradually increase expenses' : stats.expenseTrend < 0 ? 'Gradually decrease expenses' : 'Keep expenses stable'}
   - Subtract bills on their due dates (see bills list above)
   - Consider weekly patterns (weekends may have different spending)
   - Balance should change realistically day-by-day, not jump randomly

2. CALCULATION METHODOLOGY:
   - Day 1 balance = Current Balance + Day 1 Income - Day 1 Expenses - Bills Due Day 1
   - Day 2 balance = Day 1 Balance + Day 2 Income - Day 2 Expenses - Bills Due Day 2
   - Continue for all ${forecastDays} days
   - If income pattern is 'end_of_month' and forecast includes month end, add income on appropriate day
   - Apply small random variations (±5%) to daily expenses to reflect reality
   - Ensure balance never goes negative unless expenses truly exceed income + savings

3. FINANCIAL ADVICE (3-5 items in BAHASA INDONESIA) - MUST BE SPECIFIC AND ACTIONABLE:
   
   CRITICAL: Each advice MUST include specific numbers, dates, or details from the data. Generic advice is NOT acceptable.
   
   REQUIRED FORMAT FOR EACH ADVICE:
   - Include specific amounts (Rp XXX)
   - Include specific dates if relevant
   - Include specific category names
   - Include specific percentages or comparisons
   - Provide actionable recommendations with concrete steps
   
   EXAMPLES OF GOOD SPECIFIC ADVICE:
   ✅ "Saldo Anda diprediksi akan menjadi negatif (Rp -500.000) pada tanggal 25 Desember karena tagihan listrik Rp 500.000 yang jatuh tempo. Siapkan dana sekarang untuk menghindari defisit."
   
   ✅ "Dengan pemasukan rata-rata Rp ${avgMonthlyIncome.toLocaleString('id-ID')}/bulan dan pengeluaran Rp ${avgMonthlyExpense.toLocaleString('id-ID')}/bulan, Anda dapat menabung sekitar Rp ${(avgMonthlyIncome - avgMonthlyExpense).toLocaleString('id-ID')}/bulan. Pertimbangkan untuk mengalokasikan 20% (Rp ${Math.round((avgMonthlyIncome - avgMonthlyExpense) * 0.2).toLocaleString('id-ID')}) ke dana darurat."
   
   ✅ "Ada ${bills?.length || 0} tagihan yang akan datang dengan total Rp ${upcomingBillsTotal.toLocaleString('id-ID')}. Tagihan terbesar adalah ${bills && bills.length > 0 ? bills.sort((a, b) => Number(b.amount) - Number(a.amount))[0].bill_name + ' sebesar Rp ' + Number(bills.sort((a, b) => Number(b.amount) - Number(a.amount))[0].amount).toLocaleString('id-ID') : 'tidak ada'} jatuh tempo pada ${bills && bills.length > 0 ? new Date(bills.sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0].due_date).toLocaleDateString('id-ID') : 'tidak ada'}. Pastikan dana tersedia."
   
   ✅ "Pengeluaran kategori ${Object.entries(stats.categoryPatterns).sort((a, b) => b[1].total - a[1].total)[0]?.[0] || 'Food'} mencapai Rp ${Object.entries(stats.categoryPatterns).sort((a, b) => b[1].total - a[1].total)[0]?.[1]?.total?.toLocaleString('id-ID') || '0'} (${Math.round((Object.entries(stats.categoryPatterns).sort((a, b) => b[1].total - a[1].total)[0]?.[1]?.total || 0) / totalExpense * 100)}% dari total pengeluaran). Pertimbangkan mengurangi ${Math.round((Object.entries(stats.categoryPatterns).sort((a, b) => b[1].total - a[1].total)[0]?.[1]?.total || 0) * 0.1)} atau sekitar 10% untuk mengoptimalkan anggaran."
   
   ✅ "Berdasarkan tren, pengeluaran Anda ${stats.expenseTrend > 0 ? 'meningkat sekitar Rp ' + Math.round(stats.expenseTrend * 30).toLocaleString('id-ID') + '/bulan' : stats.expenseTrend < 0 ? 'menurun sekitar Rp ' + Math.round(Math.abs(stats.expenseTrend) * 30).toLocaleString('id-ID') + '/bulan' : 'stabil'}. ${stats.expenseTrend > 0 ? 'Perlu evaluasi pengeluaran yang meningkat.' : stats.expenseTrend < 0 ? 'Lanjutkan kebiasaan baik ini!' : 'Tetap pertahankan pola pengeluaran saat ini.'}"
   
   ❌ BAD - TOO GENERIC (DO NOT USE):
   - "Waspadai jika saldo diprediksi menjadi negatif" (missing specific date/amount)
   - "Sarankan untuk menabung jika pendapatan lebih besar dari pengeluaran" (missing specific amount)
   - "Ingatkan tentang tagihan yang akan datang" (missing specific bills)
   - "Rekomendasikan penyesuaian anggaran" (missing specific recommendations)
   - "Berikan tips berdasarkan analisis" (missing specific tips)
   
   ADVICE REQUIREMENTS:
   - Analyze forecastBalance array to find specific dates where balance becomes negative
   - Calculate exact savings potential using actual income/expense numbers
   - List specific upcoming bills with amounts and dates
   - Identify top spending categories with percentages
   - Provide specific budget reduction amounts
   - Mention specific dates from forecast period
   - Use actual numbers from the data provided

4. ACCURACY ESTIMATE (0-100%):
   Base accuracy on:
   - Data quality: ${stats.totalDays >= 90 ? 'High (3+ months)' : stats.totalDays >= 60 ? 'Medium (2+ months)' : 'Low (<2 months)'} = ${Math.min(100, Math.max(40, stats.totalDays * 0.5))}%
   - Consistency: Low std deviation = higher accuracy
   - Bill certainty: Known bills increase accuracy
   - Final accuracy should be: ${Math.min(95, Math.max(50, Math.round((stats.totalDays * 0.3) + 40)))}-${Math.min(100, Math.max(70, Math.round((stats.totalDays * 0.3) + 60)))}%

CRITICAL: ALL RESPONSES MUST BE IN BAHASA INDONESIA. No English allowed.

RESPONSE FORMAT (MUST BE VALID JSON, NO TEXT BEFORE OR AFTER):
{
  "forecastBalance": [number, number, number, ...], // EXACTLY ${forecastDays} numbers representing end-of-day balance
  "advice": [
    "Saran spesifik 1 dengan angka Rp XXX dan tanggal yang jelas",
    "Saran spesifik 2 dengan detail konkret dan persentase",
    "Saran spesifik 3 dengan rekomendasi angka yang bisa ditindaklanjuti",
    ...
  ], // 3-5 advice strings IN BAHASA INDONESIA - MUST include specific numbers, dates, amounts, or percentages
  "accuracy": number // 0-100, realistic accuracy based on data quality
}

ADVICE VALIDATION RULES - CRITICAL:
- Each advice string MUST contain at least one number (amount in Rp, percentage, date, or count)
- Each advice MUST reference actual data from the analysis above
- Generic advice without specific details is NOT acceptable
- Examples of REQUIRED elements in each advice:
  * Specific amounts: "Rp XXX"
  * Specific dates: "tanggal XX"
  * Specific percentages: "XX%"
  * Specific counts: "X tagihan"
  * Specific categories or bill names

VALIDATION RULES:
- forecastBalance must have EXACTLY ${forecastDays} values
- Each value should be realistic (considering daily income/expense patterns)
- Bills must be subtracted on their due dates
- Balance should generally trend according to net daily flow: ${stats.avgDailyIncome - stats.avgDailyExpense > 0 ? 'Increasing' : 'Decreasing'}
- If current balance is ${currentBalance}, first day prediction should be close to: ${Math.round(currentBalance + stats.avgDailyIncome - stats.avgDailyExpense)}`;

    console.log(`🤖 [AI Forecast] Sending request to OpenAI...`);

    // Call OpenAI API with JSON mode for better consistency
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a financial forecasting expert for WealthEase app. You MUST respond with ONLY valid JSON format. NO text before or after JSON. ALL advice text MUST be in BAHASA INDONESIA (Indonesian language).'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2, // Lower temperature for more consistent and accurate output
      max_tokens: 3000, // Increased for more detailed forecasts
      response_format: { type: "json_object" } // Force JSON output for consistency
    });

    const aiResponse = completion.choices[0].message.content.trim();
    console.log(`🤖 [AI Forecast] AI response preview: ${aiResponse.substring(0, 200)}...`);

    // Parse JSON from AI response (with JSON mode, should be direct JSON)
    let forecastData;
    try {
      // Try parsing directly first (JSON mode should return pure JSON)
      forecastData = JSON.parse(aiResponse);
    } catch (directParseError) {
      // Fallback: try to extract JSON from markdown or text
      let jsonString = null;
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1];
      } else {
        const directJsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (directJsonMatch) {
          jsonString = directJsonMatch[0];
        }
      }

      if (!jsonString) {
        console.error('❌ [AI Forecast] No JSON found in AI response');
        console.error('   Response preview:', aiResponse.substring(0, 500));
        return res.status(500).json({ 
          error: 'AI did not return valid JSON format',
          details: 'Please try again or contact support'
        });
      }

      forecastData = JSON.parse(jsonString);
    }

    try {

      // Validate response structure
      if (!forecastData.forecastBalance || !Array.isArray(forecastData.forecastBalance)) {
        throw new Error('Missing or invalid forecastBalance array');
      }

      if (!forecastData.advice || !Array.isArray(forecastData.advice)) {
        throw new Error('Missing or invalid advice array');
      }

      if (typeof forecastData.accuracy !== 'number' || forecastData.accuracy < 0 || forecastData.accuracy > 100) {
        throw new Error('Missing or invalid accuracy (must be 0-100)');
      }

      // Post-process forecast balance for accuracy improvements
      
      // 1. Ensure forecastBalance has correct length
      if (forecastData.forecastBalance.length !== forecastDays) {
        console.warn(`⚠️ [AI Forecast] forecastBalance length mismatch. Expected ${forecastDays}, got ${forecastData.forecastBalance.length}`);
        // Pad or trim array to match expected length
        if (forecastData.forecastBalance.length < forecastDays) {
          const lastValue = forecastData.forecastBalance[forecastData.forecastBalance.length - 1] || currentBalance;
          while (forecastData.forecastBalance.length < forecastDays) {
            forecastData.forecastBalance.push(lastValue);
          }
        } else {
          forecastData.forecastBalance = forecastData.forecastBalance.slice(0, forecastDays);
        }
      }

      // 2. Apply bill corrections (subtract bills on due dates)
      const billDates = {};
      bills?.forEach(bill => {
        if (!bill.completed) {
          const dueDate = new Date(bill.due_date);
          const today = new Date();
          const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
          if (daysUntilDue >= 0 && daysUntilDue < forecastDays) {
            if (!billDates[daysUntilDue]) {
              billDates[daysUntilDue] = 0;
            }
            billDates[daysUntilDue] += Number(bill.amount || 0);
          }
        }
      });

      // 3. Apply realistic daily changes and bill deductions with hybrid approach
      const processedForecast = [currentBalance];
      for (let day = 1; day < forecastDays; day++) {
        let previousBalance = processedForecast[day - 1];
        
        // Check if income should come (based on pattern)
        let dayIncome = 0;
        if (incomeCycle === 'end_of_month') {
          const today = new Date();
          const forecastDate = new Date(today);
          forecastDate.setDate(forecastDate.getDate() + day);
          const dayOfMonth = forecastDate.getDate();
          if (dayOfMonth >= 25 || dayOfMonth <= 5) {
            dayIncome = avgMonthlyIncome; // Income on month end
          }
        } else if (incomeCycle === 'mid_month') {
          const today = new Date();
          const forecastDate = new Date(today);
          forecastDate.setDate(forecastDate.getDate() + day);
          const dayOfMonth = forecastDate.getDate();
          if (dayOfMonth >= 10 && dayOfMonth <= 15) {
            dayIncome = avgMonthlyIncome; // Income mid-month
          }
        } else {
          // Distribute income evenly if no pattern
          dayIncome = stats.avgDailyIncome;
        }
        
        // Calculate expense for this day (with trend adjustment)
        const dayExpense = Math.max(0, stats.avgDailyExpense + (stats.expenseTrend * day));
        
        // Subtract bills due today
        const billsDueToday = billDates[day] || 0;
        
        // Calculate new balance using baseline calculation
        const aiPredictedBalance = forecastData.forecastBalance[day] || currentBalance;
        const calculatedBalance = previousBalance + dayIncome - dayExpense - billsDueToday;
        
        // Blend AI prediction with calculated baseline (75% AI for flexibility, 25% calculated for realism)
        // This ensures predictions are both AI-powered and mathematically sound
        const blendedBalance = (aiPredictedBalance * 0.75) + (calculatedBalance * 0.25);
        
        processedForecast.push(Math.max(0, Math.round(blendedBalance))); // Ensure non-negative
      }
      
      // 4. Apply smoothing to reduce wild fluctuations
      const smoothedForecast = processedForecast.map((balance, idx) => {
        if (idx === 0 || idx === processedForecast.length - 1) {
          return balance;
        }
        // Moving average smoothing (3-day window)
        const prevBalance = processedForecast[idx - 1];
        const nextBalance = processedForecast[idx + 1];
        return Math.round((prevBalance * 0.2 + balance * 0.6 + nextBalance * 0.2));
      });
      
      forecastData.forecastBalance = smoothedForecast;

      // 5. Generate specific financial insights based on actual data
      const specificInsights = [];
      
      // Insight 1: Negative balance warning with specific date and amount
      const minBalance = Math.min(...forecastData.forecastBalance);
      if (minBalance < 0) {
        const firstNegativeDay = forecastData.forecastBalance.findIndex(b => b < 0);
        const today = new Date();
        const negativeDate = new Date(today);
        negativeDate.setDate(negativeDate.getDate() + firstNegativeDay);
        specificInsights.push(`⚠️ PERINGATAN DEFISIT: Saldo Anda diprediksi akan menjadi negatif (Rp ${Math.abs(minBalance).toLocaleString('id-ID')}) pada ${negativeDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}. Segera siapkan dana minimal Rp ${Math.abs(minBalance).toLocaleString('id-ID')} untuk menghindari defisit.`);
      } else {
        // If no negative, provide savings insight
        if (avgMonthlyIncome > avgMonthlyExpense) {
          const savings = avgMonthlyIncome - avgMonthlyExpense;
          const savingsPercent = Math.round((savings / avgMonthlyIncome) * 100);
          const emergencyFund = Math.round(savings * 0.2);
          specificInsights.push(`💰 POTENSI MENABUNG: Dengan pemasukan rata-rata Rp ${avgMonthlyIncome.toLocaleString('id-ID')}/bulan dan pengeluaran Rp ${avgMonthlyExpense.toLocaleString('id-ID')}/bulan, Anda memiliki potensi menabung Rp ${savings.toLocaleString('id-ID')}/bulan (${savingsPercent}% dari pemasukan). Alokasikan minimal Rp ${emergencyFund.toLocaleString('id-ID')} (20%) untuk dana darurat.`);
        }
      }
      
      // Insight 2: Upcoming bills with specific details
      if (bills && bills.length > 0) {
        const sortedBills = [...bills].sort((a, b) => Number(b.amount) - Number(a.amount));
        const largestBill = sortedBills[0];
        const soonestBill = [...bills].sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];
        const today = new Date();
        const daysUntilSoonest = Math.ceil((new Date(soonestBill.due_date) - today) / (1000 * 60 * 60 * 24));
        specificInsights.push(`📋 TAGIHAN YANG AKAN DATANG: Anda memiliki ${bills.length} tagihan dengan total Rp ${upcomingBillsTotal.toLocaleString('id-ID')}. Tagihan terbesar: "${largestBill.bill_name}" sebesar Rp ${Number(largestBill.amount).toLocaleString('id-ID')}. Tagihan terdekat: "${soonestBill.bill_name}" (Rp ${Number(soonestBill.amount).toLocaleString('id-ID')}) jatuh tempo dalam ${daysUntilSoonest} hari (${new Date(soonestBill.due_date).toLocaleDateString('id-ID')}).`);
      }
      
      // Insight 3: Category analysis with specific recommendations
      if (Object.keys(stats.categoryPatterns).length > 0) {
        const topCategory = Object.entries(stats.categoryPatterns).sort((a, b) => b[1].total - a[1].total)[0];
        if (topCategory && topCategory[1].total > 0) {
          // Calculate total expense from category patterns
          const totalCategoryExpense = Object.values(stats.categoryPatterns).reduce((sum, cat) => sum + cat.total, 0);
          const categoryPercent = totalCategoryExpense > 0 ? Math.round((topCategory[1].total / totalCategoryExpense) * 100) : 0;
          const suggestedReduction = Math.round(topCategory[1].total * 0.15);
          const categoryName = topCategory[0].charAt(0).toUpperCase() + topCategory[0].slice(1);
          specificInsights.push(`📊 ANALISIS KATEGORI: Pengeluaran terbesar Anda adalah kategori "${categoryName}" sebesar Rp ${topCategory[1].total.toLocaleString('id-ID')} (${categoryPercent}% dari total pengeluaran, rata-rata Rp ${topCategory[1].avg.toLocaleString('id-ID')}/transaksi dari ${topCategory[1].count} transaksi). Pertimbangkan mengurangi pengeluaran ${categoryName} sekitar 15% (Rp ${suggestedReduction.toLocaleString('id-ID')}/bulan) untuk mengoptimalkan anggaran.`);
        }
      }
      
      // Insight 4: Trend analysis with specific amounts
      const monthlyTrend = stats.expenseTrend * 30;
      if (Math.abs(monthlyTrend) > 1000) { // Only show if trend is significant
        if (monthlyTrend > 0) {
          specificInsights.push(`📈 TREN PENGELUARAN MENINGKAT: Pengeluaran Anda cenderung meningkat sekitar Rp ${Math.round(monthlyTrend).toLocaleString('id-ID')}/bulan. Jika tren ini berlanjut, dalam 3 bulan pengeluaran bisa naik Rp ${Math.round(monthlyTrend * 3).toLocaleString('id-ID')}. Evaluasi kembali pengeluaran rutin dan identifikasi area yang bisa dihemat.`);
        } else {
          specificInsights.push(`📉 TREN PENGELUARAN MENURUN: Pengeluaran Anda cenderung menurun sekitar Rp ${Math.round(Math.abs(monthlyTrend)).toLocaleString('id-ID')}/bulan. Pertahankan kebiasaan baik ini! Dengan tren ini, dalam 3 bulan Anda bisa menghemat sekitar Rp ${Math.round(Math.abs(monthlyTrend) * 3).toLocaleString('id-ID')}.`);
        }
      }
      
      // Insight 5: Balance projection with specific numbers
      const finalBalance = forecastData.forecastBalance[forecastData.forecastBalance.length - 1];
      const balanceChange = finalBalance - currentBalance;
      const balanceChangePercent = currentBalance > 0 ? Math.round((balanceChange / currentBalance) * 100) : 0;
      
      if (Math.abs(balanceChange) > 10000) { // Only show if significant change
        if (balanceChange > 0) {
          specificInsights.push(`📊 PROYEKSI SALDO: Dalam ${forecastDays} hari ke depan, saldo Anda diprediksi meningkat dari Rp ${currentBalance.toLocaleString('id-ID')} menjadi Rp ${finalBalance.toLocaleString('id-ID')} (naik Rp ${balanceChange.toLocaleString('id-ID')} atau ${balanceChangePercent}%). Terus pertahankan pola keuangan yang positif ini.`);
        } else {
          specificInsights.push(`📊 PROYEKSI SALDO: Dalam ${forecastDays} hari ke depan, saldo Anda diprediksi menurun dari Rp ${currentBalance.toLocaleString('id-ID')} menjadi Rp ${finalBalance.toLocaleString('id-ID')} (turun Rp ${Math.abs(balanceChange).toLocaleString('id-ID')} atau ${Math.abs(balanceChangePercent)}%). Pertimbangkan untuk mengurangi pengeluaran atau mencari sumber pemasukan tambahan.`);
        }
      }
      
      // Combine AI advice with specific insights (replace generic ones)
      if (forecastData.advice && Array.isArray(forecastData.advice)) {
        const finalAdvice = [];
        
        // Use specific insights as priority, fill remaining slots with AI advice if specific enough
        specificInsights.forEach((insight, idx) => {
          if (idx < 5) {
            finalAdvice.push(insight);
          }
        });
        
        // Add AI advice only if it's specific (contains numbers/dates)
        forecastData.advice.forEach((advice) => {
          if (finalAdvice.length < 5) {
            const hasSpecificData = /\d/.test(advice) && (/\bRp\s?\d/i.test(advice) || /\d{1,2}\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)/i.test(advice) || /%\s/.test(advice));
            if (hasSpecificData) {
              finalAdvice.push(advice);
            }
          }
        });
        
        // Ensure we have at least 3-5 insights
        while (finalAdvice.length < 3 && specificInsights.length > finalAdvice.length) {
          finalAdvice.push(specificInsights[finalAdvice.length]);
        }
        
        forecastData.advice = finalAdvice.slice(0, 5); // Max 5 insights
      } else {
        // If no AI advice, use only specific insights
        forecastData.advice = specificInsights.slice(0, 5);
      }

      // 6. Validate and adjust accuracy based on data quality
      const baseAccuracy = Math.min(95, Math.max(50, Math.round((stats.totalDays * 0.3) + 40)));
      const consistencyBonus = stats.incomeStdDev < avgMonthlyIncome * 0.3 ? 5 : 0; // More consistent = more accurate
      const billBonus = bills && bills.length > 0 ? 5 : 0; // Known bills increase accuracy
      forecastData.accuracy = Math.min(100, baseAccuracy + consistencyBonus + billBonus);

      console.log(`✅ [AI Forecast] Forecast generated successfully`);
      console.log(`   - Balance predictions: ${forecastData.forecastBalance.length} days`);
      console.log(`   - Advice items: ${forecastData.advice.length}`);
      console.log(`   - Accuracy: ${forecastData.accuracy}%`);

      // Return forecast data
      res.json({
        success: true,
        forecast: {
          forecastBalance: forecastData.forecastBalance,
          advice: forecastData.advice,
          accuracy: forecastData.accuracy
        },
        metadata: {
          period,
          currentBalance,
          avgMonthlyIncome,
          avgMonthlyExpense,
          upcomingBillsTotal,
          forecastDays
        }
      });

    } catch (parseError) {
      console.error('❌ [AI Forecast] Error parsing AI response:', parseError);
      console.error('   JSON string:', jsonString.substring(0, 500));
      return res.status(500).json({ 
        error: 'Failed to parse AI response',
        details: parseError.message
      });
    }

  } catch (error) {
    console.error('❌ [AI Forecast] Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate forecast',
      details: error.message 
    });
  }
};

