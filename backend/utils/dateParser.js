// Helper functions to parse and normalize natural language dates

/**
 * Parse natural language date expressions to YYYY-MM-DD format
 * @param {string} dateText - Natural language date (e.g., "tanggal 30 bulan ini", "besok")
 * @param {Date} referenceDate - Reference date (usually today)
 * @returns {string|null} - Date in YYYY-MM-DD format or null if cannot parse
 */
export const parseNaturalLanguageDate = (dateText, referenceDate = new Date()) => {
  if (!dateText || typeof dateText !== 'string') {
    return null;
  }

  const text = dateText.toLowerCase().trim();
  const today = new Date(referenceDate);
  today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

  // Indonesian month names
  const monthMap = {
    januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
    juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12,
    jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7,
    aug: 8, agu: 8, ags: 8, sep: 9, okt: 10, nov: 11, des: 12
  };

  // Helper to format date to YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to add days
  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  // Helper to get last day of month
  const getLastDayOfMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  // 1. Natural language keywords
  if (text.match(/\b(besok|esok)\b/)) {
    return formatDate(addDays(today, 1));
  }
  if (text.match(/\b(lusa)\b/)) {
    return formatDate(addDays(today, 2));
  }
  if (text.match(/\b(hari ini|hari ini juga|sekarang)\b/)) {
    return formatDate(today);
  }
  if (text.match(/\b(minggu depan)\b/)) {
    return formatDate(addDays(today, 7));
  }

  // 2. "tanggal X bulan ini" pattern
  const bulanIniMatch = text.match(/tanggal\s+(\d{1,2})\s+bulan\s+ini/i);
  if (bulanIniMatch) {
    const day = parseInt(bulanIniMatch[1], 10);
    if (day >= 1 && day <= 31) {
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      const lastDay = getLastDayOfMonth(currentYear, currentMonth + 1);
      const targetDay = Math.min(day, lastDay);
      
      const targetDate = new Date(currentYear, currentMonth, targetDay, 12, 0, 0);
      
      // If the day has passed, use next month
      if (targetDate < today && day <= lastDay) {
        return formatDate(new Date(currentYear, currentMonth + 1, targetDay, 12, 0, 0));
      }
      return formatDate(targetDate);
    }
  }

  // 3. "tanggal X bulan depan" pattern
  const bulanDepanMatch = text.match(/tanggal\s+(\d{1,2})\s+bulan\s+depan/i);
  if (bulanDepanMatch) {
    const day = parseInt(bulanDepanMatch[1], 10);
    if (day >= 1 && day <= 31) {
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const lastDay = getLastDayOfMonth(nextMonth.getFullYear(), nextMonth.getMonth() + 1);
      const targetDay = Math.min(day, lastDay);
      return formatDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), targetDay, 12, 0, 0));
    }
  }

  // 4. "akhir bulan" or "akhir bulan ini"
  if (text.match(/\b(akhir bulan|akhir bulan ini)\b/)) {
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const lastDay = getLastDayOfMonth(currentYear, currentMonth + 1);
    return formatDate(new Date(currentYear, currentMonth, lastDay, 12, 0, 0));
  }

  // 5. "awal bulan" patterns
  if (text.match(/\b(awal bulan|awal bulan depan|awal bulan ini)\b/)) {
    if (text.includes('depan')) {
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      return formatDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1, 12, 0, 0));
    }
    return formatDate(new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0));
  }

  // 6. "pertengahan bulan" patterns
  if (text.match(/\b(pertengahan bulan|tengah bulan)\b/)) {
    if (text.includes('depan')) {
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      return formatDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 15, 12, 0, 0));
    }
    return formatDate(new Date(today.getFullYear(), today.getMonth(), 15, 12, 0, 0));
  }

  // 7. "bulan depan" without specific day
  if (text.match(/\b(bulan depan)\b/) && !text.match(/tanggal/)) {
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return formatDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1, 12, 0, 0));
  }

  // 8. Date with month name: "1 Desember", "15 Januari 2025"
  const monthNameMatch = text.match(/(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|jan|feb|mar|apr|mei|jun|jul|agu|ags|sep|okt|nov|des)(?:\s+(\d{4}))?/i);
  if (monthNameMatch) {
    const day = parseInt(monthNameMatch[1], 10);
    const monthName = monthNameMatch[2].toLowerCase();
    const month = monthMap[monthName];
    const year = monthNameMatch[3] ? parseInt(monthNameMatch[3], 10) : today.getFullYear();
    
    if (month && day >= 1 && day <= 31) {
      const lastDay = getLastDayOfMonth(year, month);
      const targetDay = Math.min(day, lastDay);
      return formatDate(new Date(year, month - 1, targetDay, 12, 0, 0));
    }
  }

  // 9. Date format: DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyyMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10);
    const year = parseInt(ddmmyyyyMatch[3], 10);
    
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2020 && year <= 2100) {
      const lastDay = getLastDayOfMonth(year, month);
      const targetDay = Math.min(day, lastDay);
      const date = new Date(year, month - 1, targetDay, 12, 0, 0);
      if (date.getFullYear() === year && date.getMonth() === month - 1) {
        return formatDate(date);
      }
    }
  }

  // 10. Just a day number with context: "tanggal 15", "tgl 30"
  // This is tricky - we need to guess if it's this month or next month
  const dayOnlyMatch = text.match(/tanggal\s+(\d{1,2})|tgl\s+(\d{1,2})/i);
  if (dayOnlyMatch) {
    const day = parseInt(dayOnlyMatch[1] || dayOnlyMatch[2], 10);
    if (day >= 1 && day <= 31) {
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      const currentDay = today.getDate();
      const lastDay = getLastDayOfMonth(currentYear, currentMonth + 1);
      const targetDay = Math.min(day, lastDay);
      
      // If the day has already passed this month, use next month
      if (targetDay < currentDay) {
        const nextMonth = new Date(currentYear, currentMonth + 1, 1);
        const nextMonthLastDay = getLastDayOfMonth(nextMonth.getFullYear(), nextMonth.getMonth() + 1);
        const finalDay = Math.min(targetDay, nextMonthLastDay);
        return formatDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), finalDay, 12, 0, 0));
      } else {
        return formatDate(new Date(currentYear, currentMonth, targetDay, 12, 0, 0));
      }
    }
  }

  return null; // Cannot parse
};

/**
 * Post-process AI's date response to fix common errors
 * @param {string} aiDate - Date from AI (should be YYYY-MM-DD)
 * @param {string} userMessage - Original user message for context
 * @param {Date} referenceDate - Reference date (usually today)
 * @returns {string} - Corrected date in YYYY-MM-DD format
 */
export const correctDateFromAI = (aiDate, userMessage, referenceDate = new Date()) => {
  if (!aiDate || !userMessage) {
    return aiDate;
  }

  const message = userMessage.toLowerCase();
  
  // Try to parse with natural language parser first
  const naturalDate = parseNaturalLanguageDate(message, referenceDate);
  if (naturalDate) {
    // Validate that natural language parser got it right
    const aiDateObj = new Date(aiDate);
    const naturalDateObj = new Date(naturalDate);
    
    // If they differ significantly, prefer natural language parser for specific patterns
    if (message.includes('bulan ini') || message.includes('bulan depan') || message.includes('tanggal')) {
      const daysDiff = Math.abs((aiDateObj - naturalDateObj) / (1000 * 60 * 60 * 24));
      
      // If difference is more than 3 days, use natural language parser result
      if (daysDiff > 3) {
        console.log(`📅 [Date Correction] AI date (${aiDate}) seems wrong for "${userMessage}", using parsed date: ${naturalDate}`);
        return naturalDate;
      }
    }
  }

  return aiDate; // Return original if no correction needed
};

