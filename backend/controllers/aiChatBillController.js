import { openai } from '../config/openaiClient.js';
import { getServiceRoleClient } from '../config/supabaseClient.js';
import { parseNaturalLanguageDate, correctDateFromAI } from '../utils/dateParser.js';

// Valid bill categories (must match database CHECK constraint)
const validCategories = ['utilities', 'subscription', 'rent', 'food', 'others'];

// Helper function to normalize/validate category
const normalizeCategory = (category) => {
  if (!category || typeof category !== 'string') {
    return 'others';
  }
  
  const lowerCategory = category.toLowerCase().trim();
  
  // Direct match
  if (validCategories.includes(lowerCategory)) {
    return lowerCategory;
  }
  
  // Mapping common variations
  const categoryMap = {
    'bills': 'others',
    'bill': 'others',
    'utility': 'utilities',
    'utilities': 'utilities',
    'subscriptions': 'subscription',
    'subs': 'subscription',
    'rental': 'rent',
    'rentals': 'rent',
    'foods': 'food',
    'other': 'others',
    'lainnya': 'others',
    'lain-lain': 'others',
    // Invalid categories that should map to 'others'
    'education': 'others',
    'health': 'others',
    'debt': 'others',
    'entertainment': 'others',
    'transportation': 'others',
    'healthcare': 'others',
    'medical': 'others'
  };
  
  if (categoryMap[lowerCategory]) {
    return categoryMap[lowerCategory];
  }
  
  // Default to 'others' if no match
  return 'others';
};

// Helper to get user_id from request
const getUserId = (req) => {
  return req.user?.userId || req.user?.email || req.user?.id || null;
};

// Helper function to normalize amount from natural language
const normalizeAmount = (amountText) => {
  if (typeof amountText === 'number') {
    return amountText;
  }
  
  if (!amountText || typeof amountText !== 'string') {
    return null;
  }
  
  // Remove common currency symbols and normalize
  let text = amountText.toString().toLowerCase()
    .replace(/rp\.?/g, '')
    .replace(/rupiah/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .trim();
  
  // Extract number with multipliers
  const patterns = [
    { pattern: /(\d+(?:\.\d+)?)\s*juta/i, multiplier: 1000000 },
    { pattern: /(\d+(?:\.\d+)?)\s*jt/i, multiplier: 1000000 },
    { pattern: /(\d+(?:\.\d+)?)\s*ribu/i, multiplier: 1000 },
    { pattern: /(\d+(?:\.\d+)?)\s*rb/i, multiplier: 1000 },
    { pattern: /(\d+(?:\.\d+)?)\s*ratus/i, multiplier: 100 },
    { pattern: /(\d+(?:\.\d+)?)/, multiplier: 1 }
  ];
  
  for (const { pattern, multiplier } of patterns) {
    const match = text.match(pattern);
    if (match) {
      const number = parseFloat(match[1]);
      if (!isNaN(number)) {
        return Math.round(number * multiplier);
      }
    }
  }
  
  return null;
};

// Helper function to predict category based on bill name
const predictCategory = (billName) => {
  if (!billName || typeof billName !== 'string') {
    return 'others';
  }
  
  const name = billName.toLowerCase();
  
  // Utilities - listrik, PLN, wifi, internet, air, PAM, PDAM, gas, token listrik
  if (name.match(/\b(listrik|pln|watt|kwh|elektrik|electricity|wifi|internet|indihome|first media|mydocomo|biznet|indosat|telkom|air|pam|pdam|gas|token listrik)\b/)) return 'utilities';
  
  // Subscription - Netflix, Spotify, langganan, gym
  if (name.match(/\b(netflix|spotify|youtube premium|gym|langganan|subscription|streaming)\b/)) return 'subscription';
  
  // Rent - sewa, kontrakan, kost
  if (name.match(/\b(sewa|kontrakan|kost|rent|rental)\b/)) return 'rent';
  
  // Food
  if (name.match(/\b(makanan|food|restoran|restaurant)\b/)) return 'food';
  
  // Others - BPJS, cicilan, angsuran, sekolah, kuliah, pendidikan, pajak
  if (name.match(/\b(bpjs|cicilan|angsuran|sekolah|kuliah|pendidikan|spp|pajak|tax|fee|biaya)\b/)) return 'others';
  if (name.match(/\b(wifi|internet|indihome|first media|mydocomo|biznet|indosat|telkom)\b/)) return 'utilities';
  if (name.match(/\b(air|pam|pdam|water|air minum)\b/)) return 'utilities';
  if (name.match(/\b(gas|tabung gas|lpg)\b/)) return 'utilities';
  if (name.match(/\b(token listrik|token prepaid)\b/)) return 'utilities';
  
  // Subscription
  if (name.match(/\b(netflix|spotify|youtube premium|disney|hbo|prime video|streaming)\b/)) return 'subscription';
  if (name.match(/\b(gym|fitness|membership|langganan)\b/)) return 'subscription';
  if (name.match(/\b(subscription|subs|berlangganan)\b/)) return 'subscription';
  
  // Rent
  if (name.match(/\b(sewa|rent|kontrakan|kos|kost|rumah kontrakan)\b/)) return 'rent';
  
  // Education
  if (name.match(/\b(sekolah|kuliah|pendidikan|education|tuition|spp|uang sekolah|biaya sekolah)\b/)) return 'others'; // Using 'others' since education is not in valid categories
  
  // Health
  if (name.match(/\b(bpjs|asuransi kesehatan|kesehatan|hospital|rumah sakit)\b/)) return 'others';
  
  // Food (if explicitly mentioned)
  if (name.match(/\b(makanan|food|makan)\b/)) return 'food';
  
  // Debt/Cicilan
  if (name.match(/\b(cicilan|angsuran|debt|loan|kredit|pinjaman)\b/)) return 'others';
  
  return 'others';
};

// Helper function to validate and normalize date format
const validateAndNormalizeDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }
  
  // Try to parse YYYY-MM-DD format
  const yyyymmddPattern = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  const match = dateString.trim().match(yyyymmddPattern);
  
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    
    // Validate date ranges
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2020 || year > 2100) {
      console.warn(`⚠️ [AI Chat Bill] Invalid date values: ${year}-${month}-${day}`);
      return null;
    }
    
    // Validate actual date (e.g., Feb 30 doesn't exist)
    const date = new Date(year, month - 1, day, 12, 0, 0);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      console.warn(`⚠️ [AI Chat Bill] Invalid date (out of range): ${year}-${month}-${day}`);
      return null;
    }
    
    // Return normalized format YYYY-MM-DD with zero padding
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  
  // Try to parse other common formats
  // DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyyPattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
  const ddmmyyyyMatch = dateString.trim().match(ddmmyyyyPattern);
  
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10);
    const year = parseInt(ddmmyyyyMatch[3], 10);
    
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2020 && year <= 2100) {
      const date = new Date(year, month - 1, day, 12, 0, 0);
      if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }
  
  // Try parsing with Date constructor as last resort
  try {
    const parsedDate = new Date(dateString);
    if (!isNaN(parsedDate.getTime())) {
      const year = parsedDate.getFullYear();
      const month = parsedDate.getMonth() + 1;
      const day = parsedDate.getDate();
      
      if (year >= 2020 && year <= 2100) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  } catch (e) {
    // Ignore parsing errors
  }
  
  console.warn(`⚠️ [AI Chat Bill] Could not parse date format: "${dateString}"`);
  return null;
};

// System prompt for AI to understand the task of creating Smart Bills
const SYSTEM_PROMPT = `You are a Smart Bill assistant for WealthEase app. Your PRIMARY job is to EXTRACT BILL INFORMATION from user messages and prepare it for confirmation.

CRITICAL RULES - READ CAREFULLY:
1. When a user mentions ANY bill or recurring payment, you MUST extract the information and respond with ONLY a valid JSON object. NO TEXT BEFORE OR AFTER THE JSON.

   ⚠️ DETECTION PRIORITY - Check these FIRST (most common patterns):
   - If message contains "akan bayar" OR "akan membayar" + amount (ribu/juta/number) + date/time → THIS IS A BILL REQUEST, extract immediately!
   - If message contains item name (listrik/pajak/sewa/etc.) + amount + date/time → THIS IS A BILL REQUEST, extract immediately!
   - If message contains "Tagihan" + item + amount + date/time → THIS IS A BILL REQUEST, extract immediately!
   - DO NOT greet the user if you detect bill information in their message. Extract the bill data immediately!

   BILL REQUEST KEYWORDS TO RECOGNIZE (Indonesian natural language):
   - "Aku ingin smartbill...", "Saya ingin smartbill...", "Tolong buat smartbill...", "Buatkan smartbill..."
   - "Tolong buat invoice...", "Buat invoice otomatis...", "Buatkan invoice...", "Invoice untuk..."
   - "untuk biaya...", "untuk tagihan...", "untuk pembayaran..."
   - "smartbill untuk...", "smart bill untuk..."
   - "biaya kebersihan", "biaya cleaning", "biaya maintenance", "biaya perawatan"
   - "nominal" (synonym for amount/jumlah)
   - "tanggal jatuh tempo" (due date)
   - "jatuh tempo tanggal..."
   - Any mention of future payment, bill, tagihan, kontrakan, sewa, kost, listrik, internet, invoice, etc.
   
   FUTURE TENSE PATTERNS (indicates bill request - CHECK THESE FIRST):
   - "saya akan bayar...", "aku akan bayar...", "akan membayar...", "akan bayar..." → ALWAYS extract as bill request!
   - Pattern: "[subject] akan bayar [item] [amount] [date/time]" → Extract ALL information immediately
   - Pattern: "saya akan bayar [item] [amount] [date/time]" → Extract bill info (with or without "sebesar")
   - Pattern: "[item] [amount] [date/time]" → Simple format, extract all info
   - Pattern: "Tagihan [item] [amount] [date/time]" → Direct bill mention
   
   ⚠️ CRITICAL: If you see "akan bayar" + amount + date, DO NOT greet or give examples. Extract the bill data immediately!
   
   Examples of what to extract IMMEDIATELY:
     * "saya akan bayar pajak 15 juta tanggal 12 bulan depan" → billName: "Pajak", amount: 15000000, dueDate: day 12 next month
     * "saya akan bayar pajak sebesar 10 juta bulan depan" → billName: "Pajak", amount: 10000000, dueDate: first day next month
     * "Tagihan listrik 500 ribu bulan depan" → billName: "Tagihan Listrik", amount: 500000, dueDate: first day next month
     * "aku akan bayar listrik 300 ribu tanggal 15" → billName: "Tagihan Listrik", amount: 300000, dueDate: day 15
     * "akan membayar sewa kost 2 juta tanggal 1" → billName: "Sewa Kost", amount: 2000000, dueDate: day 1
     * "saya akan bayar listrik 500 ribu besok" → billName: "Tagihan Listrik", amount: 500000, dueDate: tomorrow
   
   IMPORTANT: "invoice otomatis" or "buat invoice" means the same as creating a Smart Bill. Extract the information.
   
   If user uses phrases like "Tolong buat invoice otomatis untuk..." or "untuk biaya...", treat this as a bill request and extract data.

2. Do NOT create the bill immediately - you MUST wait for user confirmation.
3. Your job is ONLY to EXTRACT and PREPARE the data - the system will handle creation after confirmation.
4. If user mentions multiple bills (using words like "dan", "serta", "juga", "kemudian"), you MUST return array format with "bills" key.
5. Your response MUST ALWAYS be valid JSON that can be parsed directly - no explanations, no greetings, just JSON.
6. Output MUST be pure JSON without any text before or after it.
7. ⚠️ CRITICAL: If AMOUNT is missing or NOT mentioned in the user message, you MUST return JSON with "error" field: {"error": "message"} asking for the amount. DO NOT return a bill object with amount: 0 or null.
   - If user says "tambahkan bayar kuliah bulan depan tanggal 15" → NO AMOUNT mentioned → Return {"error": "Saya sudah memahami Anda ingin membuat Smart Bill untuk Pembayaran Kuliah tanggal 15 bulan depan. Berapa nominal yang harus dibayar?"}
   - If user says "buat tagihan listrik bulan depan" → NO AMOUNT mentioned → Return {"error": "Saya sudah memahami Anda ingin membuat Smart Bill untuk Tagihan Listrik bulan depan. Berapa nominal tagihan listriknya?"}
   - NEVER create a bill object with amount: 0, amount: null, or missing amount field.

8. If DATE is missing, you can use a reasonable default (first day of next month) OR return error asking for clarification.
9. If user just greets or doesn't mention a bill (NO keywords like "akan bayar", "tagihan", amount, date, etc.), return JSON with "error" field: {"error": "message"} explaining you can help with bills.
10. ⚠️ IMPORTANT: If you detect "akan bayar" + amount + any date/time reference, you MUST extract bill information even if date is vague. Use reasonable defaults (e.g., "bulan depan" = first day of next month, "tanggal X" = day X of next month if passed, current month if not passed).

JSON FORMAT:
- SINGLE bill: {"billName":string,"amount":number,"dueDate":"YYYY-MM-DD","category":string,"description":string}
- MULTIPLE bills: {"bills":[{"billName":string,"amount":number,"dueDate":"YYYY-MM-DD","category":string,"description":string}, ...]}

🔍 FIELD EXTRACTION GUIDE - READ CAREFULLY:

1. BILL NAME (billName) - Extract from these keywords (prioritize most descriptive name):
   
   UTILITIES:
   - "listrik", "PLN" → "Tagihan Listrik" or "PLN"
   - "wifi", "internet", "indihome", "first media", "mydocomo", "biznet", "indosat", "telkom" → "Tagihan Internet" or specific provider name
   - "air", "PAM", "PDAM" → "Tagihan Air" or "PAM"
   - "gas", "tabung gas", "LPG" → "Tagihan Gas"
   - "token listrik" → "Token Listrik"
   
   RENT:
   - "sewa", "kontrakan", "kost", "rent" → "Sewa Rumah", "Sewa Kost", or specific name
   - "biaya kontrakan", "biaya sewa", "biaya kost" → Extract descriptive name like "Biaya Kontrakan" or "Sewa Kost"
   
   MAINTENANCE/CLEANING/UTILITIES:
   - "biaya kebersihan", "biaya cleaning", "biaya pembersihan" → "Biaya Kebersihan"
   - "biaya maintenance", "biaya perawatan", "biaya servis" → "Biaya Maintenance" or "Biaya Perawatan"
   - "biaya keamanan", "biaya security" → "Biaya Keamanan"
   - "biaya parkir", "biaya parking" → "Biaya Parkir"
   
   DEBT/INSTALLMENT:
   - "cicilan", "angsuran" → "Cicilan" + item name (e.g., "Cicilan Motor", "Cicilan Rumah")
   
   HEALTH:
   - "BPJS" → "BPJS"
   
   SUBSCRIPTION:
   - "langganan", "subscription" → "Langganan" + service name
   - "Netflix", "Spotify", "YouTube Premium", "gym", "fitness" → Use exact service name
   
   EDUCATION:
   - "sekolah", "kuliah", "pendidikan", "SPP", "uang sekolah", "biaya sekolah" → "Biaya Pendidikan" or specific name
   
   TAXES/FEES:
   - "pajak", "tax", "pajak penghasilan", "PPh", "pajak bumi bangunan", "PBB" → "Pajak" or specific tax name
   - "iuran", "retribusi", "biaya administrasi", "administrasi" → Use descriptive name like "Iuran" or "Biaya Administrasi"
   
   IMPORTANT: Use the most descriptive and specific name possible. If user mentions a brand name, use it.
   
   EXAMPLES:
   - "besok saya bayar kuliah 2 juta" → billName: "Pembayaran Kuliah" or "Biaya Kuliah"
   - "sekolah 5 juta tanggal 1" → billName: "Biaya Sekolah" or "SPP"

2. AMOUNT (amount) - Extract and normalize to number (in Rupiah):
   
   KEYWORDS TO DETECT:
   - "Rp", "rupiah", "ribu", "ratus", "juta", "biaya", "bayar", "tagihan", "total", "sebesar"
   - "nominal" (important: "nominal" means amount in Indonesian)
   - "dengan nominal...", "nominalnya...", "nominal sebesar..."
   
   NORMALIZATION EXAMPLES:
   - "Rp 200.000" or "Rp 200000" → 200000
   - "200 ribu" or "200rb" or "200 rb" → 200000
   - "2 juta" or "2jt" or "2 jt" → 2000000
   - "500 ratus" → 50000
   - "1.5 juta" or "1,5 juta" or "1.5 juta" → 1500000 (decimal format supported)
   - "sebesar 500 ribu" → 500000
   - "biaya 150 ribu" → 150000
   - "tagihan sebesar 2 juta" → 2000000
   - "nominal 1,5 juta" or "nominal 1.5 juta" → 1500000
   - "dengan nominal 2 juta" → 2000000
   
   RULES:
   - Remove all dots (.) used as thousand separators
   - Convert commas (,) to dots for decimals if needed
   - "ribu" → multiply by 1000
   - "juta" → multiply by 1000000
   - "ratus" → multiply by 100
   - Amount MUST be a number (integer), not a string
   - If amount is ambiguous or unclear, use the most reasonable interpretation

3. DUE DATE (dueDate) - Convert ALL forms to "YYYY-MM-DD" format. This is CRITICAL!
   
   TANGGAL EKSPLISIT (Explicit Dates with Numbers):
   - "tanggal 1", "tgl 1", "tanggal 01", "tgl 01" → Use CURRENT_DATE to determine month/year
   - "tanggal 12", "tgl 12", "tanggal 14", "tgl 7", "tgl 30" → Calculate based on context
   - If no month mentioned, assume current or next month based on context
   - "tanggal 05", "tanggal 14" → Calculate based on context (usually next month if past, current if future)
   - "tanggal besok lusa" → Calculate 2 days from today
   
   PATTERN: "tanggal X bulan ini" (CRITICAL):
   - "tanggal 15 bulan ini" → Current month, day 15. If day 15 has passed, use next month.
   - "tanggal 30 bulan ini" → Current month, day 30. If day 30 has passed, use next month.
   - "tanggal X bulan ini" → Current month, day X. If day X has ALREADY PASSED this month, use NEXT month.
   - Always check if the day has passed. If passed → use next month.
   
   PATTERN: "tanggal X bulan depan":
   - "tanggal 15 bulan depan" → Next month, day 15
   - "tanggal X bulan depan" → Next month, day X
   
   FORMAT TANGGAL DENGAN TANDA:
   - "12/03/2025" → "2025-03-12" (DD/MM/YYYY format)
   - "12-03-2025" → "2025-03-12" (DD-MM-YYYY format)
   - "2025-03-12" → "2025-03-12" (already in correct format)
   
   BAHASA ALAM (Natural Language):
   - "besok" → Tomorrow (calculate exact date from CURRENT_DATE)
   - "lusa" → 2 days from today
   - "minggu depan" → 7 days from today
   - "bulan depan" → First day of next month
   - "akhir bulan" → Last day of current month (28/29/30/31 depending on month)
   - "awal bulan" → First day of current/next month (use context)
   - "pertengahan bulan" → 15th of current/next month (use context)
   - "nanti sore" → Today's date (same as CURRENT_DATE)
   - "hari ini" → Today's date (same as CURRENT_DATE)
   
   TANGGAL DENGAN NAMA BULAN:
   - "1 Desember", "1 Des", "1 Desember 2024" → "2024-12-01"
   - "5 November", "5 Nov", "tanggal jatuh tempo 5 November" → "2024-11-05" (use current year if not specified)
   - "15 Januari", "15 Jan" → Use current year if not specified
   - Support Indonesian months: Januari, Februari, Maret, April, Mei, Juni, Juli, Agustus, September, Oktober, November, Desember
   - Support short forms: Jan, Feb, Mar, Apr, Mei, Jun, Jul, Agu/Ags, Sep, Okt, Nov, Des
   - IMPORTANT: Recognize "tanggal jatuh tempo X" pattern - extract the date after "tanggal jatuh tempo"
   
   CRITICAL RULES FOR DATE CALCULATION:
   - ALWAYS return in "YYYY-MM-DD" format (e.g., "2024-12-01")
   - Use CURRENT_DATE (provided below) as reference for "today"
   - For "tanggal X bulan ini": Check if day X has passed. If PASSED → use next month. If NOT PASSED → use current month.
   - For "tanggal X bulan depan": Always use next month, day X
   - Calculate relative dates (besok, lusa, etc.) based on CURRENT_DATE provided below
   - NEVER return dates in other formats like DD/MM/YYYY or natural language
   - Be PRECISE with date calculations - calculate exactly, don't guess

4. CATEGORY (category) - Must be EXACTLY one of these 5 values (lowercase, no exceptions):
   
   VALID CATEGORIES (ONLY these 5 categories are allowed):
   - "utilities" - for: listrik, PLN, wifi, internet, air, PAM, PDAM, gas, token listrik, utilities bills
   - "subscription" - for: Netflix, Spotify, YouTube Premium, gym membership, langganan, streaming services
   - "rent" - for: sewa, kontrakan, kost, rumah kontrakan, office rent
   - "food" - for: makanan, food-related bills, groceries
   - "others" - for: BPJS, cicilan, angsuran, sekolah, kuliah, pendidikan, pajak, taxes, fees, debt, education, health, and ANYTHING ELSE
   
   ⚠️ CRITICAL: Categories like "education", "health", "debt", "entertainment", "transportation" are NOT valid.
   These MUST be mapped to "others". ONLY use the 5 categories listed above.
   
   CATEGORY PREDICTION (if not explicitly mentioned):
   Always predict category based on billName keywords:
   - billName contains: "listrik", "PLN", "wifi", "internet", "air", "PAM", "PDAM", "gas", "token" → "utilities"
   - billName contains: "Netflix", "Spotify", "gym", "fitness", "langganan", "subscription", "streaming" → "subscription"
   - billName contains: "sewa", "kontrakan", "kost", "rent" → "rent"
   - billName contains: "makanan", "food", "restoran" → "food"
   - billName contains: "BPJS", "cicilan", "angsuran", "sekolah", "kuliah", "pendidikan", "pajak", "tax", "fee", "education", "health" → "others"
   - If uncertain or unknown category → ALWAYS use "others"

5. DESCRIPTION (description):
   
   KEYWORDS TO EXTRACT:
   - "catatan", "keterangan", "detail", "info tambahan", "penjelasan"
   - "untuk siapa" → include person/recipient info
   - "bulan apa" → include month information
   
   RULES:
   - Extract any additional notes, details, or explanations from user message
   - If user mentions "untuk siapa", include person/recipient info (e.g., "Tagihan untuk rumah kontrakan")
   - If user mentions "bulan apa", include month info (e.g., "Tagihan listrik bulan Desember")
   - Keep it concise but informative (max 2-3 sentences)
   - If no description provided, create a simple descriptive one based on bill name:
     * "Tagihan listrik bulanan"
     * "Iuran BPJS bulanan"
     * "Langganan Netflix bulanan"
     * "Sewa kost bulanan"
   - Do NOT repeat information already in billName, amount, or dueDate

NORMALIZATION RULES:
- Normalize amounts: "200 ribu" → 200000, "2 juta" → 2000000
- Convert natural language dates to YYYY-MM-DD format
- Predict category if not explicitly mentioned
- Always use Indonesian month names correctly

EXAMPLES:

1. User: "besok saya akan bayar listrik 500 ribu"
   Response: {"billName":"Tagihan Listrik","amount":500000,"dueDate":"2024-11-28","category":"utilities","description":"Tagihan listrik bulanan"}

2. User: "pada tanggal 1 desember saya akan membayar pajak sebesar 2 juta"
   Response: {"billName":"Pajak","amount":2000000,"dueDate":"2024-12-01","category":"others","description":"Pembayaran pajak"}

3. User: "tanggal 15 bulan depan tagihan internet 300 ribu"
   Response: {"billName":"Tagihan Internet","amount":300000,"dueDate":"2024-12-15","category":"utilities","description":"Tagihan internet bulanan"}

4. User: "cicilan rumah 5 juta tanggal 5"
   Response: {"billName":"Cicilan Rumah","amount":5000000,"dueDate":"2024-12-05","category":"others","description":"Cicilan rumah bulanan"}

5. User: "BPJS 150 ribu jatuh tempo akhir bulan"
   Response: {"billName":"BPJS","amount":150000,"dueDate":"2024-11-30","category":"others","description":"Iuran BPJS bulanan"}

6. User: "sewa kost 2 juta tanggal 1 setiap bulan"
   Response: {"billName":"Sewa Kost","amount":2000000,"dueDate":"2024-12-01","category":"rent","description":"Sewa kost bulanan"}

7. User: "Netflix 150 ribu lusa"
   Response: {"billName":"Netflix","amount":150000,"dueDate":"2024-11-29","category":"subscription","description":"Langganan Netflix bulanan"}

8. User: "besok saya bayar kuliah 2 juta"
   Response: {"billName":"Pembayaran Kuliah","amount":2000000,"dueDate":"2024-11-28","category":"others","description":"Biaya kuliah bulanan"}
   NOTE: Category MUST be "others", NOT "education" (education is not a valid category)

9. User: "sekolah 5 juta tanggal 1"
   Response: {"billName":"Biaya Sekolah","amount":5000000,"dueDate":"2024-12-01","category":"others","description":"Biaya sekolah bulanan"}
   NOTE: Education-related bills MUST use category "others"

10. User: "Tolong buat tagihan listrik sebesar 230 ribu jatuh tempo tanggal 30 bulan ini"
    Response: {"billName":"Tagihan Listrik","amount":230000,"dueDate":"2024-11-30","category":"utilities","description":"Tagihan listrik bulanan"}
    NOTE: "tanggal 30 bulan ini" = day 30 of CURRENT month. Check CURRENT_DATE below to calculate correctly.
    If CURRENT_DATE shows day > 30, then use next month's day 30.

11. User: "Halo" or "Apa kabar?" (no bill mentioned)
    Response: {"error": "Halo! Saya bisa membantu Anda membuat Smart Bill. Contoh: 'Buat tagihan listrik 500 ribu tanggal 15 bulan depan'"}

12. User: "Aku ingin smartbill untuk biaya kontrakan tanggal jatuh tempo 5 November dengan nominal 1,5 juta"
    Response: {"billName":"Biaya Kontrakan","amount":1500000,"dueDate":"2024-11-05","category":"rent","description":"Biaya kontrakan bulanan"}
    NOTE: Extract "biaya kontrakan" as billName, "nominal 1,5 juta" (or "nominal 1.5 juta") as amount (1500000), 
    "tanggal jatuh tempo 5 November" as dueDate (use current year if year not specified), and "rent" as category.

13. User: "Saya ingin smartbill untuk tagihan listrik dengan nominal 500 ribu jatuh tempo tanggal 15 bulan depan"
    Response: {"billName":"Tagihan Listrik","amount":500000,"dueDate":"2024-12-15","category":"utilities","description":"Tagihan listrik bulanan"}
    NOTE: Recognize "untuk tagihan..." and "nominal..." patterns.

14. User: "Tolong buatkan smartbill untuk sewa kost dengan nominal 2 juta jatuh tempo tanggal 1 setiap bulan"
    Response: {"billName":"Sewa Kost","amount":2000000,"dueDate":"2024-12-01","category":"rent","description":"Sewa kost bulanan"}
    NOTE: Recognize "untuk sewa..." pattern and extract amount from "nominal...".

15. User: "Tolong buat invoice otomatis untuk biaya kebersihan 75 ribu"
    Response: {"billName":"Biaya Kebersihan","amount":75000,"dueDate":"2024-12-01","category":"others","description":"Biaya kebersihan bulanan"}
    NOTE: "invoice otomatis" means Smart Bill. Extract "biaya kebersihan" as billName, "75 ribu" as amount (75000).
    If no date mentioned, use first day of next month as default dueDate.

16. User: "Buat invoice untuk biaya maintenance 200 ribu tanggal 10"
    Response: {"billName":"Biaya Maintenance","amount":200000,"dueDate":"2024-12-10","category":"others","description":"Biaya maintenance bulanan"}
    NOTE: Recognize "invoice" as bill request, extract "biaya maintenance" as billName, amount and date.

17. User: "Tolong buatkan invoice untuk biaya perawatan 150 ribu jatuh tempo tanggal 5 bulan depan"
    Response: {"billName":"Biaya Perawatan","amount":150000,"dueDate":"2025-01-05","category":"others","description":"Biaya perawatan bulanan"}
    NOTE: "invoice" = Smart Bill, extract all information including date.

18. User: "saya akan bayar pajak sebesar 10 juta bulan depan"
    Response: {"billName":"Pajak","amount":10000000,"dueDate":"2024-12-01","category":"others","description":"Pembayaran pajak"}
    NOTE: "akan bayar" = future payment = bill request. Extract "pajak" as billName, "10 juta" as amount (10000000), "bulan depan" as dueDate (first day of next month).

19. User: "Tagihan listrik 500 ribu bulan depan"
    Response: {"billName":"Tagihan Listrik","amount":500000,"dueDate":"2024-12-01","category":"utilities","description":"Tagihan listrik bulanan"}
    NOTE: Simple format "[item] [amount] [time]". Extract "Tagihan listrik" as billName, "500 ribu" as amount (500000), "bulan depan" as dueDate (first day of next month).

20. User: "aku akan bayar listrik 300 ribu tanggal 15"
    Response: {"billName":"Tagihan Listrik","amount":300000,"dueDate":"2024-12-15","category":"utilities","description":"Tagihan listrik bulanan"}
    NOTE: "akan bayar" = bill request. Extract "listrik" as billName, "300 ribu" as amount (300000), "tanggal 15" as dueDate (calculate based on current date).

21. User: "akan membayar sewa kost 2 juta tanggal 1 bulan depan"
    Response: {"billName":"Sewa Kost","amount":2000000,"dueDate":"2024-12-01","category":"rent","description":"Sewa kost bulanan"}
    NOTE: "akan membayar" = bill request. Extract all information.

22. User: "saya akan bayar sekolah 5 juta tanggal 5"
    Response: {"billName":"Biaya Sekolah","amount":5000000,"dueDate":"2024-12-05","category":"others","description":"Biaya sekolah bulanan"}
    NOTE: "akan bayar" + future date = bill request.

23. User: "saya akan bayar pajak 15 juta tanggal 12 bulan depan"
    Response: {"billName":"Pajak","amount":15000000,"dueDate":"2024-12-12","category":"others","description":"Pembayaran pajak"}
    NOTE: "akan bayar" = bill request. Extract "pajak" as billName, "15 juta" as amount (15000000), "tanggal 12 bulan depan" as dueDate (day 12 of next month).

24. User: "saya akan bayar pajak sebesar 10 juta bulan depan"
    Response: {"billName":"Pajak","amount":10000000,"dueDate":"2024-12-01","category":"others","description":"Pembayaran pajak"}
    NOTE: "akan bayar" = bill request. Extract all information even without explicit date - use first day of next month if only "bulan depan" mentioned.

25. User: "aku akan bayar listrik 500 ribu tanggal 15"
    Response: {"billName":"Tagihan Listrik","amount":500000,"dueDate":"2024-12-15","category":"utilities","description":"Tagihan listrik bulanan"}
    NOTE: "akan bayar" = bill request. Extract immediately - do NOT greet or give examples.

26. User: "saya akan bayar listrik 300 ribu besok"
    Response: {"billName":"Tagihan Listrik","amount":300000,"dueDate":"2024-11-28","category":"utilities","description":"Tagihan listrik bulanan"}
    NOTE: "akan bayar" + amount + date = bill request. Calculate "besok" based on CURRENT_DATE provided.

27. User: "tambahkan bayar kuliah bulan depan tanggal 15" (NO AMOUNT mentioned)
    Response: {"error": "Saya sudah memahami Anda ingin membuat Smart Bill untuk Pembayaran Kuliah tanggal 15 bulan depan. Berapa nominal yang harus dibayar untuk kuliah tersebut?"}
    NOTE: Amount is missing → Return error JSON asking for amount. DO NOT return bill object with amount: 0.

28. User: "buat tagihan listrik bulan depan" (NO AMOUNT mentioned)
    Response: {"error": "Saya sudah memahami Anda ingin membuat Smart Bill untuk Tagihan Listrik bulan depan. Berapa nominal tagihan listriknya?"}
    NOTE: Amount is missing → Return error JSON asking for amount. DO NOT return bill object.

29. User: "saya akan bayar sewa kost tanggal 1" (NO AMOUNT mentioned)
    Response: {"error": "Saya sudah memahami Anda ingin membuat Smart Bill untuk Sewa Kost tanggal 1. Berapa nominal sewa kostnya?"}
    NOTE: Amount is missing → Return error JSON asking for amount. DO NOT return bill object.

CRITICAL: If user message contains ANY of these patterns:
- "akan bayar [item] [amount] [date]" → Extract bill immediately (NO greeting, NO examples, JUST JSON)
- "[item] [amount] [date]" → Extract bill immediately
- "Tagihan [item] [amount] [date]" → Extract bill immediately

DO NOT return greeting message if bill information is detected!

12. IMPORTANT: After extracting bill data, you MUST inform user to review and confirm. 
    The system will redirect user to SmartBill creation page. DO NOT create bill immediately.
    Always wait for user confirmation before creating bill.

⚠️ CRITICAL REMINDERS:
1. Extract information PRECISELY from user message
2. Normalize amounts properly: "200 ribu" → 200000, "2 juta" → 2000000
3. Convert ALL date formats to "YYYY-MM-DD" - NO EXCEPTIONS
4. Predict category automatically if not explicitly mentioned
5. Output MUST be pure JSON - NO text before, NO text after, NO explanations
6. JSON must be valid and parseable directly
7. If information is missing or ambiguous, use reasonable defaults but prioritize accuracy
8. Amount must be a number (integer), never a string
9. Due date must always be in "YYYY-MM-DD" format

📋 OUTPUT FORMAT:
Your response MUST be ONLY this JSON structure (no other text):
{
  "billName": "string",
  "amount": number,
  "dueDate": "YYYY-MM-DD",
  "category": "utilities|subscription|rent|food|others",
  "description": "string"
}

Or for multiple bills:
{
  "bills": [
    {
      "billName": "string",
      "amount": number,
      "dueDate": "YYYY-MM-DD",
      "category": "utilities|subscription|rent|food|others",
      "description": "string"
    },
    ...
  ]
}

Remember: NO TEXT BEFORE OR AFTER THE JSON!`;

export const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = getUserId(req);
    const email = req.user?.email || userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!openai) {
      return res.status(500).json({
        error: 'AI service is not available. Please configure OPENAI_API_KEY in backend/.env'
      });
    }

    console.log(`🤖 [AI Chat Bill] User ${userId} sent message: ${message.substring(0, 50)}...`);

    // Get chat history from database
    const adminClient = getServiceRoleClient();
    const { data: chatHistory, error: historyError } = await adminClient
      .from('ai_chat_bill_history')
      .select('message, role')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(10); // Get last 10 messages for context

    if (historyError) {
      console.error('Error fetching chat history:', historyError);
    }

    // Build conversation history
    const conversationHistory = [];
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach(msg => {
        conversationHistory.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.message
        });
      });
    }

    // Add system prompt with current date context (multiple formats for clarity)
    const now = new Date();
    const currentDateNatural = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const currentDateNumeric = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Calculate tomorrow and day after tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const lusa = new Date(now);
    lusa.setDate(lusa.getDate() + 2);
    const lusaStr = lusa.toISOString().split('T')[0];
    
    // Calculate last day of current month
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
    const akhirBulan = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
    
    // Calculate "tanggal 30 bulan ini" example
    const calculateTanggal30BulanIni = () => {
      const targetDay = 30;
      const finalDay = Math.min(targetDay, lastDayOfMonth);
      if (finalDay >= currentDay) {
        return `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(finalDay).padStart(2, '0')}`;
      } else {
        const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
        const nextLastDay = new Date(nextYear, nextMonth, 0).getDate();
        const nextFinalDay = Math.min(targetDay, nextLastDay);
        return `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(nextFinalDay).padStart(2, '0')}`;
      }
    };
    
    const systemPromptWithDate = `${SYSTEM_PROMPT}

📅 CURRENT DATE INFORMATION (CRITICAL - Use these for ALL date calculations):
- Today's Date (Natural): ${currentDateNatural}
- Today's Date (YYYY-MM-DD): ${currentDateNumeric}
- Today's Day: ${currentDay}
- Today's Month: ${currentMonth}
- Today's Year: ${currentYear}
- Last Day of Current Month: ${lastDayOfMonth}

DATE CALCULATION EXAMPLES (based on CURRENT DATE above):
- "besok" = Tomorrow = ${tomorrowStr}
- "lusa" = Day after tomorrow = ${lusaStr}
- "tanggal 30 bulan ini" = ${calculateTanggal30BulanIni()} (Current month, day 30. If already passed, use next month)
- "akhir bulan" = Last day of current month = ${akhirBulan}
- "tanggal X bulan ini" = Current month, day X. If day has already passed, use next month.

IMPORTANT: When user says "tanggal X bulan ini", check if day X has passed. If passed, use next month.

Use these examples to calculate dates EXACTLY.`;

    const messages = [
      { role: 'system', content: systemPromptWithDate },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Call OpenAI API with response_format to ensure JSON output
    console.log(`🤖 [AI Chat Bill] Sending request to OpenAI...`);
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.3, // Lower temperature for more consistent JSON output
      max_tokens: 1000,
      response_format: { type: 'json_object' }, // Force JSON response
    });

    const aiResponse = completion.choices[0]?.message?.content || '';
    console.log(`🤖 [AI Chat Bill] AI Response (first 200 chars):`, aiResponse.substring(0, 200));
    console.log(`🤖 [AI Chat Bill] Full AI Response:`, aiResponse);

    // Save user message to database
    await adminClient
      .from('ai_chat_bill_history')
      .insert({
        user_id: userId,
        message: message.trim(),
        role: 'user'
      });

    // Start with AI response, but will be overridden if bill is successfully created
    let aiMessage = aiResponse;
    let billData = null;
    let billsArray = null;

    // Try to parse JSON from AI response
    let jsonString = aiResponse.trim();

    // Remove markdown code blocks if present
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Try to extract JSON object from the response
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    try {
      const parsedData = JSON.parse(jsonString);

      // Check if AI returned an error message in JSON format
      if (parsedData.error) {
        console.log('⚠️ [AI Chat Bill] AI returned error in JSON:', parsedData.error);
        aiMessage = parsedData.error;
        billData = null;
        billsArray = null;
      } else {
        // Handle multiple bills - process first one only for now
      if (parsedData.bills && Array.isArray(parsedData.bills) && parsedData.bills.length > 0) {
          console.log(`📋 [AI Chat Bill] Multiple bills detected, processing first bill only for extraction`);
          parsedData = parsedData.bills[0]; // Use first bill for extraction
        }
        
        // Process single bill (either from single bill response or first of multiple bills)
        if (parsedData.billName && parsedData.dueDate && parsedData.description) {
        console.log(`✅ [AI Chat Bill] Single bill data parsed:`, parsedData);

        // SIMPLIFIED LOGIC: Since user is already on SmartBill page (drawer chatbot),
        // directly create the bill after extraction - no confirmation needed
        const lowerMessage = message.toLowerCase();
        
        // Check if this is a confirmation message (user saying yes/ok after extraction)
        let isConfirmation = false;
        if (chatHistory && chatHistory.length > 0) {
          const lastAssistantMsg = [...chatHistory].reverse().find(msg => msg.role === 'assistant');
          if (lastAssistantMsg && lastAssistantMsg.message) {
            const lastMsgLower = lastAssistantMsg.message.toLowerCase();
            // Check if previous message asked for confirmation
            const hasConfirmationRequest = lastMsgLower.includes('periksa') || 
                                          lastMsgLower.includes('apakah sudah benar') ||
                                          lastMsgLower.includes('ingin diedit');
            
            // Confirmation keywords
            const confirmationKeywords = /\b(ya|yes|benar|setuju|lanjut|sudah benar|oke|ok|sip|konfirmasi|confirmed|yakin|lanjutkan|iya|buat|buatkan)\b/;
            
            if (hasConfirmationRequest && confirmationKeywords.test(lowerMessage)) {
              isConfirmation = true;
              console.log(`✅ [AI Chat Bill] Confirmation detected: "${message}"`);
            }
          }
        }
        
        // DEFAULT: Create bill immediately after extraction (user is on SmartBill page)
        // Only skip creation if explicitly not a bill creation request (e.g., just greeting)
        // Enhanced detection for bill creation requests in natural Indonesian
        const isBillCreationRequest = lowerMessage.includes('buat') || 
                                     lowerMessage.includes('buatkan') ||
                                     lowerMessage.includes('tagihan') ||
                                     lowerMessage.includes('listrik') ||
                                     lowerMessage.includes('internet') ||
                                     lowerMessage.includes('air') ||
                                     lowerMessage.includes('pam') ||
                                     lowerMessage.includes('netflix') ||
                                     lowerMessage.includes('spotify') ||
                                     lowerMessage.includes('bpjs') ||
                                     lowerMessage.includes('cicilan') ||
                                     lowerMessage.includes('sewa') ||
                                     lowerMessage.includes('kost') ||
                                     lowerMessage.includes('kontrakan') ||
                                     lowerMessage.includes('reminder') ||
                                     lowerMessage.includes('tambah') ||
                                     lowerMessage.includes('smartbill') ||
                                     lowerMessage.includes('smart bill') ||
                                     lowerMessage.includes('invoice') ||
                                     lowerMessage.includes('untuk biaya') ||
                                     lowerMessage.includes('untuk tagihan') ||
                                     lowerMessage.includes('aku ingin') ||
                                     lowerMessage.includes('saya ingin') ||
                                     lowerMessage.includes('tolong buat') ||
                                     lowerMessage.includes('biaya kebersihan') ||
                                     lowerMessage.includes('biaya cleaning') ||
                                     lowerMessage.includes('biaya maintenance') ||
                                     lowerMessage.includes('biaya perawatan') ||
                                     lowerMessage.includes('biaya keamanan') ||
                                     lowerMessage.includes('biaya parkir') ||
                                     lowerMessage.includes('nominal');
        
        // Normalize and validate all data first
        try {
          // Normalize amount if it's a string or needs conversion
          let normalizedAmount = parsedData.amount;
          if (typeof parsedData.amount === 'string') {
            const parsedAmount = normalizeAmount(parsedData.amount);
            if (parsedAmount !== null) {
              normalizedAmount = parsedAmount;
              console.log(`💰 [AI Chat Bill] Amount normalized: "${parsedData.amount}" -> ${normalizedAmount}`);
            } else {
              console.error(`❌ [AI Chat Bill] Could not parse amount: "${parsedData.amount}"`);
              aiMessage = `Saya memahami permintaan Anda, tetapi jumlah "${parsedData.amount}" tidak valid. Silakan coba lagi.`;
              billData = null;
            }
          }
          
          if (!normalizedAmount || typeof normalizedAmount !== 'number' || normalizedAmount <= 0) {
            console.error(`❌ [AI Chat Bill] Invalid or missing amount:`, normalizedAmount);
            
            // Check if this is because amount was missing (0 or null) vs invalid format
            const billName = parsedData.billName || 'tagihan ini';
            if (normalizedAmount === 0 || normalizedAmount === null || normalizedAmount === undefined) {
              aiMessage = `Saya sudah memahami Anda ingin membuat Smart Bill untuk "${billName}", tetapi nominal pembayarannya belum disebutkan. Berapa jumlah yang harus dibayar?`;
            } else {
              aiMessage = `Saya memahami permintaan Anda, tetapi jumlah "${normalizedAmount}" tidak valid. Silakan berikan nominal yang benar (contoh: "2 juta", "500 ribu", dll).`;
            }
            billData = null;
        } else {
            // Normalize and validate category - use prediction if category missing
            let categoryToUse = parsedData.category || predictCategory(parsedData.billName);
            const normalizedCategory = normalizeCategory(categoryToUse);
            if (categoryToUse !== normalizedCategory) {
              console.log(`🔄 [AI Chat Bill] Category normalized: "${categoryToUse}" -> "${normalizedCategory}"`);
        }
            if (!parsedData.category) {
              console.log(`🔮 [AI Chat Bill] Category predicted from bill name: "${parsedData.billName}" -> "${normalizedCategory}"`);
            }
            
            // Validate and normalize date format
            let normalizedDate = validateAndNormalizeDate(parsedData.dueDate);
            
            // If validation fails, try natural language parsing
            if (!normalizedDate) {
              console.log(`⚠️ [AI Chat Bill] Date validation failed, trying natural language parser for: "${parsedData.dueDate}"`);
              const naturalDate = parseNaturalLanguageDate(message, new Date());
              if (naturalDate) {
                normalizedDate = naturalDate;
                console.log(`📅 [AI Chat Bill] Date parsed from natural language: "${parsedData.dueDate}" -> "${normalizedDate}"`);
              }
            }
            
            // Post-process to correct common AI errors
            if (normalizedDate) {
              const correctedDate = correctDateFromAI(normalizedDate, message, new Date());
              if (correctedDate !== normalizedDate) {
                console.log(`🔧 [AI Chat Bill] Date corrected: "${normalizedDate}" -> "${correctedDate}"`);
                normalizedDate = correctedDate;
              }
            }
            
            if (!normalizedDate) {
              console.error(`❌ [AI Chat Bill] Invalid date format: "${parsedData.dueDate}"`);
              aiMessage = `Saya memahami permintaan Anda, tetapi format tanggal "${parsedData.dueDate}" tidak valid. Format yang benar: YYYY-MM-DD (contoh: 2024-12-01)`;
              billData = null;
            } else {
              console.log(`📅 [AI Chat Bill] Final date: "${parsedData.dueDate}" -> "${normalizedDate}"`);
              
          // Fix date off-by-one error:
          // 1. Parse YYYY-MM-DD manually
              const [year, month, day] = normalizedDate.split('-').map(Number);

          // 2. Create date object at NOON to avoid timezone shifts when converting to UTC/ISO
          const dateForDB = new Date(year, month - 1, day, 12, 0, 0);

              // 3. Validate the date object
              if (isNaN(dateForDB.getTime())) {
                console.error(`❌ [AI Chat Bill] Invalid date after parsing: ${year}-${month}-${day}`);
                aiMessage = `Saya memahami permintaan Anda, tetapi tanggal tidak valid`;
                billData = null;
              } else {
                // 4. Create formatted string manually for the response message
          const dateForMessage = `${day}/${month}/${year}`;

                // Prepare extracted bill data
                const extractedBillData = {
                  billName: parsedData.billName.trim(),
                  amount: normalizedAmount,
                  dueDate: normalizedDate,
                  category: normalizedCategory,
                  description: parsedData.description.trim()
                };

                // EXTRACTION MODE: Only extract data, don't create bill
                // User will confirm by submitting the pre-filled form
                console.log(`📋 [AI Chat Bill] ========== EXTRACTION MODE ==========`);
                console.log(`📋 [AI Chat Bill] Extracting bill data for form pre-fill`);
                console.log(`📋 [AI Chat Bill] Message: "${message}"`);
                console.log(`📋 [AI Chat Bill] Bill will NOT be created - waiting for form confirmation`);
                console.log(`📋 [AI Chat Bill] =========================================`);
                
                if (isBillCreationRequest) {
                  // Prepare extracted data for form pre-fill (DO NOT create bill yet)
                  console.log(`📋 [AI Chat Bill] Preparing extracted data for form pre-fill...`);
                  
                  // Format date for display in message
                  const dateForDisplay = new Date(dateForDB).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  });
                  
                  // Prepare extracted bill data (without id - not created yet)
                  billData = {
                    billName: extractedBillData.billName,
                    amount: extractedBillData.amount,
                    dueDate: extractedBillData.dueDate,
                    category: extractedBillData.category,
                    description: extractedBillData.description,
                    needsConfirmation: true // Flag to indicate this needs form confirmation
                  };
                  
                  // Message showing extracted data and asking user to check form
                  aiMessage = `✅ Saya sudah mengekstrak informasi Smart Bill Anda:\n\n` +
                    `📋 **Nama:** ${extractedBillData.billName}\n` +
                    `💰 **Jumlah:** Rp ${normalizedAmount.toLocaleString('id-ID')}\n` +
                    `📅 **Jatuh Tempo:** ${dateForDisplay}\n` +
                    `📂 **Kategori:** ${normalizedCategory.charAt(0).toUpperCase() + normalizedCategory.slice(1)}\n` +
                    `📝 **Deskripsi:** ${extractedBillData.description}\n\n` +
                    `Silakan periksa dan konfirmasi Smart Bill Anda di form yang sudah terisi.`;
                  
                  console.log(`📋 [AI Chat Bill] Extracted bill data ready for form pre-fill:`, JSON.stringify(billData, null, 2));
                  console.log(`📋 [AI Chat Bill] ✅ Extraction mode - NO bill created yet. Form will be pre-filled.`);
                } else {
                  // This is NOT a bill creation request (e.g., greeting), just return message
                  console.log(`📋 [AI Chat Bill] Not a bill creation request, skipping extraction`);
                  aiMessage = `Halo! Saya bisa membantu Anda membuat Smart Bill. Contoh: "Tambahkan tagihan listrik 500 ribu tanggal 15 bulan depan"`;
                  billData = null;
                }
              }
            }
          }
        } catch (billErr) {
          console.error('❌ [AI Chat Bill] Error creating bill:', billErr);
          console.error('   Error stack:', billErr.stack);
          aiMessage = `Saya sudah memahami bill Anda, tapi terjadi error saat menyimpan. Silakan coba lagi.`;
          billData = null;
        }
      } else {
        // Invalid bill data, use AI response as is
        console.log('⚠️ [AI Chat Bill] Invalid bill data structure');
        console.log('⚠️ [AI Chat Bill] Parsed data:', JSON.stringify(parsedData, null, 2));
        // Don't show success message if bill data is invalid
        if (aiMessage.includes('✅') || aiMessage.toLowerCase().includes('berhasil')) {
          aiMessage = `Saya memahami permintaan Anda untuk membuat bill, tetapi data yang diterima tidak valid. Silakan coba lagi dengan format yang lebih jelas.`;
        }
        billData = null;
        billsArray = null;
      }
      }
    } catch (parseError) {
      // Not valid JSON, use AI response as is
      console.log('⚠️ [AI Chat Bill] Could not parse JSON from AI response:', parseError.message);
      console.log('⚠️ [AI Chat Bill] Full AI response:', aiResponse);
      console.log('⚠️ [AI Chat Bill] JSON string that failed to parse:', jsonString?.substring(0, 500));
      
      // Check if AI response contains error or clarification request
      // If so, use the AI's message directly
      if (aiMessage && !aiMessage.includes('✅') && !aiMessage.toLowerCase().includes('berhasil')) {
        // AI might be asking for clarification or explaining something
        // Keep the AI's message as is
        console.log('📝 [AI Chat Bill] Using AI response message as is:', aiMessage);
      } else {
        // Generate a helpful error message
        aiMessage = `Maaf, saya mengalami kesulitan memahami format data. Silakan coba lagi dengan format yang lebih jelas. Contoh: "Buat tagihan listrik 500 ribu tanggal 15 bulan depan"`;
        console.log('⚠️ [AI Chat Bill] Generated error message');
      }
      
      billData = null;
      billsArray = null;
      
      // Parsing failed, bill will not be created
      console.log('⚠️ [AI Chat Bill] Parsing failed - bill will not be created');
    }

    // Save AI response to database
    await adminClient
      .from('ai_chat_bill_history')
      .insert({
        user_id: userId,
        message: aiMessage,
        role: 'assistant',
        bill_data: billData || billsArray || null
      });

    // Prepare response with bill data
    // Determine if we have a created bill (with id) or extracted bill (needsConfirmation)
    const createdBill = (billData && billData.id) ? billData : null;
    const createdBills = (billsArray && billsArray.length > 0 && billsArray[0].id) ? billsArray : null;
    
    // Check if we have extracted bill data that needs form confirmation
    const needsConfirmation = (billData && billData.needsConfirmation === true) || 
                              (billsArray && billsArray.some(b => b.needsConfirmation === true)) || 
                              false;
    
    const extractedBill = needsConfirmation ? (billData || (billsArray && billsArray[0])) : null;
    
    // Response structure
    const response = {
      message: aiMessage,
      bill: createdBill,
      bills: createdBills,
      needsConfirmation: needsConfirmation,
      extractedBill: extractedBill
    };
    
    // Log final response for debugging
    console.log(`📤 [AI Chat Bill] ========== FINAL RESPONSE ==========`);
    console.log(`📤 [AI Chat Bill] Needs confirmation: ${needsConfirmation}`);
    console.log(`📤 [AI Chat Bill] Has extractedBill: ${!!extractedBill}`);
    console.log(`📤 [AI Chat Bill] Has created bill: ${!!createdBill}`);
    console.log(`📤 [AI Chat Bill] Extracted bill:`, extractedBill ? JSON.stringify(extractedBill, null, 2) : 'null');
    console.log(`📤 [AI Chat Bill] Full response (first 500 chars):`, JSON.stringify(response, null, 2).substring(0, 500));
    console.log(`📤 [AI Chat Bill] ====================================`);

    // Return response
    res.json(response);
  } catch (error) {
    console.error('❌ [AI Chat Bill] Error:', error);
    res.status(500).json({
      error: 'Failed to process AI chat request',
      details: error.message
    });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const adminClient = getServiceRoleClient();
    const { data, error } = await adminClient
      .from('ai_chat_bill_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat history:', error);
      return res.status(500).json({ error: 'Failed to fetch chat history' });
    }

    // Transform data to match frontend expectations
    const history = (data || []).map(msg => ({
      id: msg.id,
      message: msg.message,
      role: msg.role,
      bill_data: msg.bill_data,
      created_at: msg.created_at
    }));

    res.json({ history });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
