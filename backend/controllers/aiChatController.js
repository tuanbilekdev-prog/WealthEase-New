import { openai } from '../config/openaiClient.js';
import { getServiceRoleClient } from '../config/supabaseClient.js';
import { addTransaction } from './transactionController.js';

// Helper to get user_id from request
const getUserId = (req) => {
  return req.user?.userId || req.user?.email || req.user?.id || null;
};

// Helper function to extract transaction info from user message as fallback
const extractTransactionFromMessage = (userMessage) => {
  if (!userMessage || typeof userMessage !== 'string') {
    return null;
  }

  const message = userMessage.toLowerCase().trim();
  
  // Extract amount from message
  const amountPatterns = [
    // "2 juta" or "2jt" or "2 jt"
    /(\d+(?:\.\d+)?)\s*(?:juta|jt)\b/i,
    // "200 ribu" or "200rb" or "200 rb"
    /(\d+(?:\.\d+)?)\s*(?:ribu|rb)\b/i,
    // "Rp 2.000.000" or "Rp 2000000"
    /Rp\s*(\d+(?:\.\d+)?(?:\.\d{3})*)/i,
    // Direct number
    /(\d{4,})/,
  ];

  let amount = null;
  let amountString = null;
  
  for (const pattern of amountPatterns) {
    const match = userMessage.match(pattern);
    if (match) {
      amountString = match[0];
      let numValue = parseFloat(match[1].replace(/\./g, ''));
      
      // Convert based on unit
      if (pattern.source.includes('juta') || pattern.source.includes('jt')) {
        amount = Math.round(numValue * 1000000);
      } else if (pattern.source.includes('ribu') || pattern.source.includes('rb')) {
        amount = Math.round(numValue * 1000);
      } else {
        amount = Math.round(numValue);
      }
      break;
    }
  }

  if (!amount || amount <= 0) {
    return null; // No valid amount found
  }

  // Determine transaction type
  const incomeKeywords = ['dapat', 'menerima', 'gaji', 'gajian', 'terima', 'income', 'pendapatan', 'investasi', 'freelance', 'bonus'];
  const expenseKeywords = ['beli', 'membeli', 'bayar', 'membayar', 'pembayaran', 'expense', 'pengeluaran', 'belanja'];
  
  const isIncome = incomeKeywords.some(keyword => message.includes(keyword));
  const isExpense = expenseKeywords.some(keyword => message.includes(keyword));
  
  let type = null;
  if (isIncome && !isExpense) {
    type = 'income';
  } else if (isExpense || !isIncome) {
    type = 'expense'; // Default to expense if ambiguous
  } else {
    return null; // Can't determine type
  }

  // Extract category and name based on keywords
  let category = 'Other';
  let name = '';
  
  // Income categories
  if (message.includes('gaji') || message.includes('gajian')) {
    category = 'Salary';
    name = 'Gaji';
  } else if (message.includes('freelance')) {
    category = 'Freelance';
    name = 'Freelance';
  } else if (message.includes('investasi')) {
    category = 'Investment';
    name = 'Investasi';
  } else if (message.includes('bonus') || message.includes('hadiah')) {
    category = 'Gift';
    name = message.includes('bonus') ? 'Bonus' : 'Hadiah';
  }
  // Expense categories
  else if (message.includes('kuliah') || message.includes('sekolah') || message.includes('pendidikan')) {
    category = 'Education';
    name = message.includes('kuliah') ? 'Kuliah' : message.includes('sekolah') ? 'Sekolah' : 'Pendidikan';
  } else if (message.includes('makan') || message.includes('makanan') || message.includes('restoran')) {
    category = 'Food';
    if (message.includes('makan siang')) {
      name = 'Makan Siang';
    } else if (message.includes('makan malam')) {
      name = 'Makan Malam';
    } else {
      name = 'Makan';
    }
  } else if (message.includes('bensin') || message.includes('transport') || message.includes('gojek') || message.includes('grab') || message.includes('ojek')) {
    category = 'Transportation';
    if (message.includes('bensin')) {
      name = 'Bensin';
    } else if (message.includes('gojek')) {
      name = 'Gojek';
    } else if (message.includes('grab')) {
      name = 'Grab';
    } else {
      name = 'Transportasi';
    }
  } else if (message.includes('belanja')) {
    category = 'Shopping';
    name = message.includes('belanja bulanan') ? 'Belanja Bulanan' : 'Belanja';
  } else if (message.includes('listrik') || message.includes('internet') || message.includes('air') || message.includes('pajak')) {
    category = 'Bills';
    if (message.includes('listrik')) {
      name = 'Listrik';
    } else if (message.includes('internet')) {
      name = 'Internet';
    } else if (message.includes('air')) {
      name = 'Air';
    } else {
      name = 'Pajak';
    }
  } else if (message.includes('obat') || message.includes('dokter') || message.includes('kesehatan')) {
    category = 'Health';
    if (message.includes('obat')) {
      name = 'Obat';
    } else if (message.includes('dokter')) {
      name = 'Periksa Dokter';
    } else {
      name = 'Kesehatan';
    }
  } else if (message.includes('nonton') || message.includes('film') || message.includes('hiburan')) {
    category = 'Entertainment';
    name = message.includes('nonton') ? 'Nonton Film' : 'Hiburan';
  } else {
    // Try to extract meaningful name from message
    // Remove common words and keep important nouns
    const words = userMessage.split(/\s+/);
    const stopWords = ['saya', 'aku', 'sudah', 'baru', 'tadi', 'kemarin', 'untuk', 'sebesar', 'sebesar', 'dari', 'ke'];
    
    // Find words before amount or after verb
    let nameWords = [];
    const verbIndex = words.findIndex(w => ['beli', 'membeli', 'bayar', 'membayar', 'dapat', 'menerima'].includes(w.toLowerCase()));
    const amountWordIndex = words.findIndex(w => w.match(/\d+(?:\.\d+)?/));
    
    if (verbIndex >= 0) {
      // Take words after verb until amount
      const endIndex = amountWordIndex > verbIndex ? amountWordIndex : words.length;
      nameWords = words.slice(verbIndex + 1, endIndex).filter(w => !stopWords.includes(w.toLowerCase()));
    } else if (amountWordIndex > 0) {
      // Take words before amount
      nameWords = words.slice(0, amountWordIndex).filter(w => !stopWords.includes(w.toLowerCase()));
    }
    
    if (nameWords.length > 0) {
      name = nameWords.join(' ').trim();
      if (name.length > 50) name = name.substring(0, 50);
      // Capitalize first letter
      name = name.charAt(0).toUpperCase() + name.slice(1);
    } else {
      name = type === 'income' ? 'Pendapatan' : 'Pengeluaran';
    }
  }

  // Generate description
  const description = type === 'income' ? 'Pendapatan' : 'Pengeluaran';

  return {
    type,
    amount,
    category,
    name: name || (type === 'income' ? 'Pendapatan' : 'Pengeluaran'),
    description,
  };
};


// System prompt for AI to understand the task
const SYSTEM_PROMPT = `You are a financial transaction assistant for WealthEase app. Your PRIMARY job is to CREATE TRANSACTIONS from user messages.

CRITICAL RULES - READ CAREFULLY:
1. When a user mentions ANY financial transaction (income or expense) that HAS ALREADY OCCURRED, check if the AMOUNT is mentioned.
   - If AMOUNT IS MENTIONED: You MUST respond with ONLY a valid JSON object. NO TEXT BEFORE OR AFTER THE JSON.
   - Amount keywords: "sebesar", "besar", "jumlah", "nominal", "harga", "Rp", "rupiah", "ribu", "ratus", "juta", numbers with these units
   - If user says "Tambah transaksi... sebesar X" or "650 ribu" or mentions any amount → AMOUNT IS MENTIONED → Return JSON immediately
   - If AMOUNT IS NOT MENTIONED: You MUST respond with a NATURAL LANGUAGE MESSAGE asking for the amount. DO NOT return JSON. Ask politely in Indonesian like: "Berapa nominal yang Anda terima/dapatkan?" or "Berapa jumlahnya?" or "Bisa sebutkan nominalnya?"
2. Do NOT have a conversation first - CREATE THE TRANSACTION(S) IMMEDIATELY if amount is provided.
3. Do NOT ask for confirmation - just create the transaction(s) if amount is provided.
4. If user mentions multiple transactions (using words like "dan", "serta", "juga", "kemudian"), you MUST return array format with "transactions" key.
5. Your response MUST be either:
   - Pure JSON (if amount is provided) that can be parsed directly - no explanations, no greetings, just JSON.
   - Natural language message (if amount is NOT provided) to ask for the amount.

CRITICAL: THIS IS TRANSACTION CHAT ONLY - DO NOT HANDLE BILL REQUESTS:
- TRANSACTIONS (what you should create): Financial activities that HAVE ALREADY HAPPENED
  - Keywords: "baru saja", "sudah", "tadi", "kemarin", "lalu", "telah", "gajian", "dapat", "menerima", "beli", "bayar" (when past tense), "membayar", "membeli"
  - Keywords: "Tambah transaksi", "Tambahkan transaksi", "Buat transaksi", "Tambah pengeluaran", "Tambah pemasukan"
  - Keywords: "Input transaksi", "Masukkan transaksi", "Catat transaksi", "Record transaksi"
  - Keywords: "top up", "topup", "e-wallet", "ewallet", "wallet", "saldo", "isi saldo"
  - Keywords: "belanja", "belanja bulanan", "grocery", "groceries"
  - Keywords: "kuliah", "sekolah", "pendidikan", "biaya kuliah", "biaya sekolah", "uang kuliah", "SPP"
  - Keywords: "bayar", "pembayaran", "telah bayar", "sudah bayar", "baru bayar"
  - Examples: "saya baru saja gajian 10 juta" → income transaction
  - Examples: "saya sudah bayar pajak 2 juta" → expense transaction
  - Examples: "saya baru saja beli makan 50 ribu" → expense transaction
  - Examples: "saya bayar kuliah 2 juta" → expense transaction (Education category)
  - Examples: "saya bayar 2 juta untuk kuliah" → expense transaction (Education category)
  - Examples: "saya bayar sebesar 2 juta untuk kuliah" → expense transaction (Education category)
  - Examples: "Tambah transaksi belanja bulanan sebesar 650 ribu kategori groceries" → expense transaction (Shopping category)

- BILL REQUESTS (NOT YOUR JOB - REFER TO SMART BILL CHAT):
  - If user asks to CREATE a bill or mentions FUTURE payment obligations, you MUST respond in natural language (NO JSON):
  - Say: "Maaf, saya hanya menangani transaksi yang sudah terjadi. Untuk membuat Smart Bill (tagihan yang akan datang), silakan gunakan AI Chat Bill yang terpisah di halaman Smart Bill Center."
  - Keywords that indicate bill requests: "buat tagihan", "tagihan listrik", "jatuh tempo", "reminder", "akan bayar", "besok bayar", "bulan depan", "tanggal X bulan depan"
  - Examples of bill requests you MUST redirect:
    * "Buat tagihan listrik 500 ribu tanggal 15 bulan depan" → Respond with redirect message (NO JSON)
    * "Saya akan bayar listrik besok" → Respond with redirect message (NO JSON)
    * "Reminder untuk bayar Netflix tanggal 1" → Respond with redirect message (NO JSON)


JSON FORMAT:
- SINGLE transaction: {"type":"income"|"expense","amount":number,"description":string,"category":string,"name":string}
- MULTIPLE transactions: {"transactions":[{"type":"income"|"expense","amount":number,"description":string,"category":string,"name":string}, ...]}

CATEGORIES:
Income: Salary, Freelance, Investment, Gift, Other
Expense: Food, Transportation, Shopping, Bills, Entertainment, Health, Education, Other

CATEGORY MAPPING (Indonesian/English to valid categories):
- "groceries", "grocery", "belanja", "belanja bulanan", "belanja kebutuhan", "shopping" → Shopping
- "makanan", "food", "makan", "restoran", "restaurant", "makan siang", "makan malam", "warung", "cafe" → Food
- "transport", "transportation", "transportasi", "bensin", "gas", "parkir", "gojek", "grab", "ojek", "taksi", "angkot", "bus", "kereta" → Transportation
- "hiburan", "entertainment", "nonton", "film", "cinema", "konser", "game", "games" → Entertainment
- "kesehatan", "health", "obat", "dokter", "rumah sakit", "apotek", "klinik", "check up", "pengobatan" → Health
- "pendidikan", "education", "sekolah", "kuliah", "buku", "biaya kuliah", "biaya sekolah", "uang kuliah", "SPP", "uang sekolah", "les", "kursus", "pendidikan" → Education
- "tagihan", "bills", "listrik", "internet", "air", "pajak", "retribusi", "iuran" → Bills
- "top up", "topup", "e-wallet", "wallet", "isi saldo", "top up e-wallet", "gopay", "ovo", "dana", "linkaja" → Other (expense category)
- "gaji", "salary", "gajian", "upah" → Salary
- "freelance", "freelancing", "project", "proyek" → Freelance
- "investasi", "investment", "saham", "reksadana", "deposito" → Investment
- "hadiah", "gift", "bonus", "tunjangan" → Gift

DETECTION RULES FOR MULTIPLE TRANSACTIONS:
- Look for keywords: "dan", "serta", "juga", "kemudian", "lalu", "plus", "dan juga"
- Look for multiple amounts mentioned in one sentence
- Look for both income AND expense in same message
- If user says "membeli X dan dapat Y" → 2 transactions (expense + income)
- If user says "bayar A dan bayar B" → 2 transactions (both expenses)
- If user says "dapat A dan dapat B" → 2 transactions (both income)

EXAMPLES:
1. User: "Saya dapat gaji 5 juta hari ini"
   Response: {"type":"income","amount":5000000,"description":"Gaji bulanan","category":"Salary","name":"Gaji"}

2. User: "Beli makan siang 50 ribu"
   Response: {"type":"expense","amount":50000,"description":"Makan siang","category":"Food","name":"Makan Siang"}

2a. User: "beli makan 50 ribu"
   Response: {"type":"expense","amount":50000,"description":"Makan","category":"Food","name":"Makan"}
   NOTE: Short format without "siang" - still extract as Food category, name = "Makan".

3. User: "Saya baru saja gajian sebesar 10 juta dan bayar pajak 2 juta"
   Response: {"transactions":[{"type":"income","amount":10000000,"description":"Gaji bulanan","category":"Salary","name":"Gaji"},{"type":"expense","amount":2000000,"description":"Pembayaran pajak","category":"Bills","name":"Pajak"}]}
   NOTE: "baru saja" and "bayar" (past tense) indicate completed transactions, NOT bills.

4. User: "Saya sudah bayar listrik 500 ribu tadi"
   Response: {"type":"expense","amount":500000,"description":"Pembayaran listrik","category":"Bills","name":"Listrik"}
   NOTE: "sudah" and "tadi" indicate a completed transaction, NOT a bill.


4. User: "saya baru saja membeli makan seharga 5 juta dan dapat uang dari investasi sebesar 10 juta"
   Response: {"transactions":[{"type":"expense","amount":5000000,"description":"Pembelian makanan","category":"Food","name":"Makan"},{"type":"income","amount":10000000,"description":"Uang dari investasi","category":"Investment","name":"Investasi"}]}
   NOTE: "baru saja" indicates completed transactions. This has 2 transactions - one expense (makan) and one income (investasi). MUST return array format.

5. User: "membeli makan 5 juta dan dapat investasi 10 juta"
   Response: {"transactions":[{"type":"expense","amount":5000000,"description":"Pembelian makanan","category":"Food","name":"Makan"},{"type":"income","amount":10000000,"description":"Uang dari investasi","category":"Investment","name":"Investasi"}]}
   NOTE: These are completed actions (membeli = bought, dapat = received), so they are transactions.

6. User: "Dapat gaji 8 juta, bayar listrik 500 ribu, dan beli makan 100 ribu"
   Response: {"transactions":[{"type":"income","amount":8000000,"description":"Gaji bulanan","category":"Salary","name":"Gaji"},{"type":"expense","amount":500000,"description":"Pembayaran listrik","category":"Bills","name":"Listrik"},{"type":"expense","amount":100000,"description":"Pembelian makanan","category":"Food","name":"Makan"}]}
   NOTE: "Dapat", "bayar", "beli" are past tense/completed actions, so these are transactions.

7. User: "Halo" or "Apa kabar?" (no transaction mentioned)
   Response: Just say hello naturally, NO JSON

8. User: "saya baru saja mendapat uang gajian" (transaction mentioned but NO AMOUNT)
   Response: "Berapa nominal gaji yang Anda terima?" (NO JSON - ask for amount in natural language)

9. User: "saya baru saja membeli makanan" (transaction mentioned but NO AMOUNT)
   Response: "Berapa jumlah yang Anda bayar untuk makanan tersebut?" (NO JSON - ask for amount in natural language)

10. User: "saya baru saja mendapat uang gajian 5 juta" (transaction WITH AMOUNT)
    Response: {"type":"income","amount":5000000,"description":"Gaji bulanan","category":"Salary","name":"Gaji"} (YES JSON)

11. User: "Buat tagihan listrik 500 ribu tanggal 15 bulan depan" (BILL REQUEST - NOT a transaction)
    Response: "Maaf, saya hanya menangani transaksi yang sudah terjadi. Untuk membuat Smart Bill (tagihan yang akan datang), silakan gunakan AI Chat Bill yang terpisah di halaman Smart Bill Center." (NO JSON - redirect message)

12. User: "Saya akan bayar listrik besok" (BILL REQUEST - future payment)
    Response: "Maaf, saya hanya menangani transaksi yang sudah terjadi. Untuk membuat Smart Bill (tagihan yang akan datang), silakan gunakan AI Chat Bill yang terpisah di halaman Smart Bill Center." (NO JSON - redirect message)

13. User: "Reminder untuk bayar Netflix tanggal 1" (BILL REQUEST)
    Response: "Maaf, saya hanya menangani transaksi yang sudah terjadi. Untuk membuat Smart Bill (tagihan yang akan datang), silakan gunakan AI Chat Bill yang terpisah di halaman Smart Bill Center." (NO JSON - redirect message)

14. User: "Tambah transaksi belanja bulanan sebesar 650 ribu kategori groceries"
    Response: {"type":"expense","amount":650000,"description":"Belanja bulanan","category":"Shopping","name":"Belanja Bulanan"}
    NOTE: "Tambah transaksi" = create transaction. Extract amount (650 ribu = 650000), recognize "belanja bulanan" and "kategori groceries" → Shopping category.

15. User: "Tambahkan transaksi belanja 500 ribu kategori shopping"
    Response: {"type":"expense","amount":500000,"description":"Belanja","category":"Shopping","name":"Belanja"}
    NOTE: Recognize "Tambahkan transaksi" format with explicit category mentioned.

16. User: "Tambah pengeluaran untuk makan siang 75 ribu kategori food"
    Response: {"type":"expense","amount":75000,"description":"Makan siang","category":"Food","name":"Makan Siang"}
    NOTE: "Tambah pengeluaran" = expense transaction, extract amount and category.

17. User: "Input transaksi top up e-wallet 100 ribu"
    Response: {"type":"expense","amount":100000,"description":"Top up e-wallet","category":"Other","name":"Top Up E-Wallet"}
    NOTE: "Input transaksi" = create transaction. "top up e-wallet" = transaction name. "100 ribu" = amount (100000). 
    Recognize that amount is ALREADY mentioned, so return JSON immediately - DO NOT ask for amount again.

18. User: "Masukkan transaksi topup wallet 50 ribu"
    Response: {"type":"expense","amount":50000,"description":"Top up wallet","category":"Other","name":"Top Up Wallet"}
    NOTE: "Masukkan transaksi" = create transaction. Extract amount from message (50 ribu = 50000).

19. User: "Input transaksi isi saldo e-wallet 200 ribu"
    Response: {"type":"expense","amount":200000,"description":"Isi saldo e-wallet","category":"Other","name":"Isi Saldo E-Wallet"}
    NOTE: "isi saldo" = top up. Extract amount (200 ribu = 200000).

20. User: "saya bayar kuliah 2 juta"
    Response: {"type":"expense","amount":2000000,"description":"Pembayaran kuliah","category":"Education","name":"Kuliah"}
    NOTE: "bayar kuliah" = payment for education. Extract amount (2 juta = 2000000), category = Education.

21. User: "saya bayar 2 juta untuk kuliah"
    Response: {"type":"expense","amount":2000000,"description":"Pembayaran kuliah","category":"Education","name":"Kuliah"}
    NOTE: Same as above, different word order. Extract amount and category.

22. User: "saya bayar sebesar 2 juta untuk kuliah"
    Response: {"type":"expense","amount":2000000,"description":"Pembayaran kuliah","category":"Education","name":"Kuliah"}
    NOTE: "sebesar" = amount indicator. Extract amount and recognize kuliah = Education.

23. User: "bayar kuliah 2 juta"
    Response: {"type":"expense","amount":2000000,"description":"Pembayaran kuliah","category":"Education","name":"Kuliah"}
    NOTE: Short form without "saya". Still recognize as transaction.

24. User: "sudah bayar uang sekolah 5 juta"
    Response: {"type":"expense","amount":5000000,"description":"Pembayaran uang sekolah","category":"Education","name":"Uang Sekolah"}
    NOTE: "sudah bayar" = past tense, completed transaction. "uang sekolah" = Education category.

25. User: "saya baru bayar biaya kuliah 3 juta"
    Response: {"type":"expense","amount":3000000,"description":"Pembayaran biaya kuliah","category":"Education","name":"Biaya Kuliah"}
    NOTE: "baru bayar" = just paid (past tense). Extract amount and category.

26. User: "beli obat di apotek 150 ribu"
    Response: {"type":"expense","amount":150000,"description":"Pembelian obat","category":"Health","name":"Obat"}
    NOTE: "beli obat" = buy medicine. Category = Health. Extract amount (150 ribu = 150000).

27. User: "periksa ke dokter 300 ribu"
    Response: {"type":"expense","amount":300000,"description":"Periksa ke dokter","category":"Health","name":"Periksa Dokter"}
    NOTE: Medical checkup. Category = Health. Extract amount.

28. User: "isi bensin 100 ribu"
    Response: {"type":"expense","amount":100000,"description":"Isi bensin","category":"Transportation","name":"Bensin"}
    NOTE: "isi bensin" = fuel. Category = Transportation. Extract amount.

29. User: "gojek 50 ribu"
    Response: {"type":"expense","amount":50000,"description":"Gojek","category":"Transportation","name":"Gojek"}
    NOTE: Ride-hailing service. Category = Transportation. Extract amount.

30. User: "beli makan malam 75 ribu"
    Response: {"type":"expense","amount":75000,"description":"Makan malam","category":"Food","name":"Makan Malam"}
    NOTE: Dinner expense. Category = Food. Extract amount.

31. User: "nonton film 60 ribu"
    Response: {"type":"expense","amount":60000,"description":"Nonton film","category":"Entertainment","name":"Nonton Film"}
    NOTE: Movie watching. Category = Entertainment. Extract amount.

32. User: "beli buku 200 ribu"
    Response: {"type":"expense","amount":200000,"description":"Pembelian buku","category":"Education","name":"Buku"}
    NOTE: Book purchase. Category = Education. Extract amount.

33. User: "bayar listrik 500 ribu"
    Response: {"type":"expense","amount":500000,"description":"Pembayaran listrik","category":"Bills","name":"Listrik"}
    NOTE: Electricity bill payment. Category = Bills. Extract amount. This is a COMPLETED payment, not a future bill.

34. User: "bayar pajak 2 juta"
    Response: {"type":"expense","amount":2000000,"description":"Pembayaran pajak","category":"Bills","name":"Pajak"}
    NOTE: Tax payment (completed). Category = Bills. Extract amount.

35. User: "dapat gaji 5 juta"
    Response: {"type":"income","amount":5000000,"description":"Gaji bulanan","category":"Salary","name":"Gaji"}
    NOTE: Salary income. Category = Salary. Extract amount.

36. User: "terima freelance 3 juta"
    Response: {"type":"income","amount":3000000,"description":"Freelance project","category":"Freelance","name":"Freelance"}
    NOTE: Freelance income. Category = Freelance. Extract amount.

37. User: "dapat investasi 10 juta"
    Response: {"type":"income","amount":10000000,"description":"Return dari investasi","category":"Investment","name":"Investasi"}
    NOTE: Investment return. Category = Investment. Extract amount.

38. User: "belanja bulanan 1 juta"
    Response: {"type":"expense","amount":1000000,"description":"Belanja bulanan","category":"Shopping","name":"Belanja Bulanan"}
    NOTE: Monthly shopping. Category = Shopping. Extract amount.

39. User: "catat pengeluaran makan siang 50 ribu"
    Response: {"type":"expense","amount":50000,"description":"Makan siang","category":"Food","name":"Makan Siang"}
    NOTE: "catat" = record transaction. Extract amount and category.

40. User: "record transaksi bensin 75 ribu"
    Response: {"type":"expense","amount":75000,"description":"Bensin","category":"Transportation","name":"Bensin"}
    NOTE: "record" = create transaction. Extract amount and category.

KEYWORDS TO DETECT MULTIPLE TRANSACTIONS:
- "dan" (and) → usually means multiple transactions
- "serta" (also) → usually means multiple transactions  
- "juga" (also) → usually means multiple transactions
- "kemudian" (then) → usually means multiple transactions
- "lalu" (then) → usually means multiple transactions
- Comma-separated amounts → usually means multiple transactions
- Both "membeli/beli" AND "dapat/menerima" in same sentence → 2 transactions (expense + income)

AMOUNT DETECTION - IMPORTANT VARIATIONS:
- "2 juta" = 2000000
- "2jt" = 2000000
- "2 jt" = 2000000
- "Rp 2.000.000" = 2000000
- "Rp 2000000" = 2000000
- "2.000.000" = 2000000
- "2000000" = 2000000
- "2 juta rupiah" = 2000000
- "200 ribu" = 200000
- "200rb" = 200000
- "200 rb" = 200000
- "Rp 200.000" = 200000
- "1.5 juta" = 1500000
- "1,5 juta" = 1500000
- Numbers with "ribu" (thousand), "juta" (million), "ratus" (hundred) are AMOUNTS

CRITICAL TRANSACTION DETECTION PATTERNS:
- "saya [verb] [item] [amount]" → Transaction (e.g., "saya bayar kuliah 2 juta")
- "[verb] [item] [amount]" → Transaction (e.g., "bayar kuliah 2 juta")
- "[verb] [amount] untuk [item]" → Transaction (e.g., "bayar 2 juta untuk kuliah")
- "[verb] sebesar [amount] untuk [item]" → Transaction (e.g., "bayar sebesar 2 juta untuk kuliah")
- "sudah [verb] [item] [amount]" → Completed transaction (e.g., "sudah bayar kuliah 2 juta")
- "baru [verb] [item] [amount]" → Just completed transaction (e.g., "baru bayar kuliah 2 juta")
- "[verb] di [place] [amount]" → Transaction (e.g., "beli obat di apotek 150 ribu")
- "catat [transaction] [amount]" → Record transaction (e.g., "catat pengeluaran makan 50 ribu")

REMEMBER: 
- If user mentions transaction(s) WITH amount mentioned → Return JSON immediately and create transaction(s).
- If user mentions transaction(s) BUT amount is NOT mentioned → Return natural language message asking for amount (NO JSON).
- Do not create transaction if amount is missing. Ask for it first.
- Recognize "bayar" + "kuliah/sekolah/pendidikan" as Education category expense.
- Recognize "bayar" + amount (even without explicit item) as expense transaction - extract context from message.
- Be flexible with word order - amount can come before or after the item.
- Short messages like "bayar kuliah 2 juta" are valid transactions - don't require full sentences.`;


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

    console.log(`🤖 [AI Chat] User ${userId} sent message: ${message.substring(0, 50)}...`);

    // Get chat history from database
    const adminClient = getServiceRoleClient();
    const { data: chatHistory, error: historyError } = await adminClient
      .from('ai_chat_history')
      .select('message, role')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(10); // Get last 10 messages for context

    // Build messages array for OpenAI
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    // Add chat history
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach(chat => {
        messages.push({
          role: chat.role === 'assistant' ? 'assistant' : 'user',
          content: chat.message
        });
      });
    }

    // Add current user message
    messages.push({ role: 'user', content: message });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.3, // Lower temperature for more consistent JSON output
      max_tokens: 1000, // Increased for multiple transactions
      response_format: { type: "text" } // Keep as text to allow natural language when no transaction
    });

    const aiResponse = completion.choices[0].message.content.trim();
    console.log(`🤖 [AI Chat] AI full response:`, aiResponse);
    console.log(`🤖 [AI Chat] AI response preview: ${aiResponse.substring(0, 200)}...`);

    // Save user message to database
    await adminClient
      .from('ai_chat_history')
      .insert({
        user_id: userId,
        message: message,
        role: 'user'
      });

    // Check if this is a follow-up message with just an amount (no transaction keywords)
    // This happens when user provides amount after AI asked for it
    const amountPattern = /^(Rp\s?)?(\d+(?:\.\d+)?)\s?(juta|jt|ribu|rb|ratus)?\s*$/i;
    const isAmountOnly = amountPattern.test(message.trim());
    
    // If message is just an amount and previous assistant message asked for amount
    let shouldCreateTransactionFromContext = false;
    let previousTransactionContext = null;
    
    if (isAmountOnly && chatHistory && chatHistory.length >= 2) {
      // Get last assistant message (should be asking for amount)
      const reversedHistory = [...chatHistory].reverse();
      const lastAssistantMsg = reversedHistory.find(chat => chat.role === 'assistant');
      
      if (lastAssistantMsg && lastAssistantMsg.message && 
          (lastAssistantMsg.message.includes('nominal') || 
           lastAssistantMsg.message.includes('jumlah') ||
           lastAssistantMsg.message.includes('Berapa'))) {
        // Assistant asked for amount, and now user provided just amount
        // Try to extract transaction context from the user message that came BEFORE the assistant's question
        // The user message should be in the chat history before the assistant's question
        const assistantIndex = reversedHistory.findIndex(chat => chat === lastAssistantMsg);
        if (assistantIndex >= 0) {
          // Look for the user message before this assistant message
          for (let i = assistantIndex + 1; i < reversedHistory.length; i++) {
            if (reversedHistory[i].role === 'user') {
              shouldCreateTransactionFromContext = true;
              previousTransactionContext = reversedHistory[i].message;
              console.log(`🔍 [AI Chat] Detected follow-up with amount. Previous context: "${previousTransactionContext}"`);
              break;
            }
          }
        }
      }
    }

    // Try to parse JSON from AI response
    let transactionData = null;
    let transactionsArray = null;
    let aiMessage = aiResponse;

    // Try to extract JSON from response (AI might wrap it in text, markdown, etc.)
    // First, try to find JSON in markdown code blocks
    let jsonString = null;
    const codeBlockMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1];
    } else {
      // Try to find JSON object directly
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }
    }

    if (jsonString) {
      try {
        const parsedData = JSON.parse(jsonString);
        
        // Check if it's multiple transactions (array format)
        if (parsedData.transactions && Array.isArray(parsedData.transactions)) {
          console.log(`✅ [AI Chat] Multiple transactions detected: ${parsedData.transactions.length} transactions`);
          
          const createdTransactions = [];
          const errors = [];
          
          // Process each transaction
          for (let i = 0; i < parsedData.transactions.length; i++) {
            const tx = parsedData.transactions[i];
            
            // Validate transaction data
            if (tx.type && 
                (tx.type === 'income' || tx.type === 'expense') &&
                tx.amount && 
                typeof tx.amount === 'number' &&
                tx.amount > 0 &&
                tx.category &&
                tx.name) {
              
              // Valid transaction with amount, proceed to create
              try {
                const { data: newTransaction, error: transactionError } = await adminClient
                  .from('transactions')
                  .insert({
                    user_id: userId,
                    type: tx.type,
                    amount: tx.amount,
                    name: tx.name,
                    category: tx.category,
                    description: tx.description || tx.name,
                    date: new Date().toISOString()
                  })
                  .select()
                  .single();

                if (transactionError) {
                  console.error(`❌ [AI Chat] Transaction ${i+1} creation error:`, transactionError);
                  errors.push(`${tx.name}: ${transactionError.message}`);
                } else {
                  // Only proceed if transaction was actually created with an ID
                  if (!newTransaction || !newTransaction.id) {
                    console.error(`❌ [AI Chat] Transaction ${i+1} creation returned no ID`);
                    errors.push(`${tx.name}: Gagal menyimpan transaksi`);
                  } else {
                    console.log(`✅ [AI Chat] Transaction ${i+1} created successfully:`, newTransaction.id);
                    
                    createdTransactions.push({
                      id: newTransaction.id,
                      type: tx.type,
                      amount: tx.amount,
                      name: tx.name,
                      category: tx.category,
                      description: tx.description || tx.name
                    });
                  }
                }
              } catch (transactionErr) {
                console.error(`❌ [AI Chat] Error creating transaction ${i+1}:`, transactionErr);
                errors.push(`${tx.name}: ${transactionErr.message}`);
              }
            } else {
              // Check if transaction type exists but amount is missing
              if (tx.type && (tx.type === 'income' || tx.type === 'expense') && 
                  (!tx.amount || tx.amount === null || typeof tx.amount !== 'number' || tx.amount <= 0)) {
                const transactionType = tx.type === 'income' ? 'pendapatan' : 'pengeluaran';
                const transactionName = tx.name || 'transaksi';
                errors.push(`${transactionName}: Nominal ${transactionType} belum disebutkan. Berapa jumlahnya?`);
              } else {
                errors.push(`Transaksi ${i+1}: Data tidak valid`);
              }
            }
          }
          
          // Build response message - only show success if transactions were actually created
          if (createdTransactions.length > 0) {
            // Filter only transactions with valid IDs (actually saved)
            const validTransactions = createdTransactions.filter(tx => tx.id);
            
            if (validTransactions.length > 0) {
              const successMessages = validTransactions.map(tx => 
                `${tx.type === 'income' ? 'Pendapatan' : 'Pengeluaran'} "${tx.name}" sebesar Rp ${tx.amount.toLocaleString('id-ID')}`
              );
              
              aiMessage = `✅ Berhasil membuat ${validTransactions.length} transaksi:\n${successMessages.join('\n')}`;
              
              if (errors.length > 0) {
                aiMessage += `\n\n⚠️ Beberapa transaksi gagal: ${errors.join(', ')}`;
              }
              
              transactionsArray = validTransactions;
              transactionData = validTransactions.length === 1 ? validTransactions[0] : null; // For backward compatibility
            } else {
              // No valid transactions created (all failed)
              aiMessage = `Saya sudah memahami transaksi Anda, tapi terjadi error saat menyimpan: ${errors.join(', ')}`;
              transactionsArray = null;
              transactionData = null;
            }
          } else {
            // No transactions created - check if all failed due to missing amounts
            const missingAmountErrors = errors.filter(err => err.includes('Nominal') || err.includes('belum disebutkan'));
            if (missingAmountErrors.length > 0 && missingAmountErrors.length === errors.length) {
              // All transactions are missing amounts - give a clear message asking for amounts
              aiMessage = `Saya sudah memahami transaksi Anda, namun nominalnya belum disebutkan. Bisa sebutkan nominal untuk ${parsedData.transactions.length === 1 ? 'transaksi tersebut' : 'masing-masing transaksi'}?`;
            } else {
              aiMessage = `Saya sudah memahami transaksi Anda, tapi terjadi error saat menyimpan: ${errors.join(', ')}`;
            }
          }
        }
        // Check if it's single transaction (object format)
        else if (parsedData.type && 
            (parsedData.type === 'income' || parsedData.type === 'expense') &&
            parsedData.amount && 
            typeof parsedData.amount === 'number' &&
            parsedData.amount > 0 &&
            parsedData.category &&
            parsedData.name) {
          
          console.log(`✅ [AI Chat] Single transaction data parsed:`, parsedData);

          // Create transaction automatically
          try {
            const { data: newTransaction, error: transactionError } = await adminClient
              .from('transactions')
              .insert({
                user_id: userId,
                type: parsedData.type,
                amount: parsedData.amount,
                name: parsedData.name,
                category: parsedData.category,
                description: parsedData.description || parsedData.name,
                date: new Date().toISOString()
              })
              .select()
              .single();

            if (transactionError) {
              console.error('❌ [AI Chat] Transaction creation error:', transactionError);
              aiMessage = `Saya sudah memahami transaksi Anda, tapi terjadi error saat menyimpan: ${transactionError.message}`;
              transactionData = null; // Don't include transaction data on error
            } else {
              // Only proceed if transaction was actually created with an ID
              if (!newTransaction || !newTransaction.id) {
                console.error('❌ [AI Chat] Transaction creation returned no ID');
                aiMessage = `Saya sudah memahami transaksi Anda, tapi terjadi error saat menyimpan. Silakan coba lagi.`;
                transactionData = null;
              } else {
                console.log(`✅ [AI Chat] Transaction created successfully:`, newTransaction.id);
                
                // Only show success message if transaction was actually created with ID
                aiMessage = `✅ Transaksi berhasil dibuat! ${parsedData.type === 'income' ? 'Pendapatan' : 'Pengeluaran'} sebesar Rp ${parsedData.amount.toLocaleString('id-ID')} untuk "${parsedData.name}" telah ditambahkan.`;
                
                // Update transactionData with the created transaction (only if ID exists)
                transactionData = {
                  id: newTransaction.id,
                  type: parsedData.type,
                  amount: parsedData.amount,
                  name: parsedData.name,
                  category: parsedData.category,
                  description: parsedData.description || parsedData.name
                };
              }
            }
          } catch (transactionErr) {
            console.error('❌ [AI Chat] Error creating transaction:', transactionErr);
            aiMessage = `Saya sudah memahami transaksi Anda, tapi terjadi error saat menyimpan. Silakan coba lagi.`;
          }
        } else {
          // Check if transaction structure exists but amount is missing/null
          if (parsedData.type && (parsedData.type === 'income' || parsedData.type === 'expense') && 
              (!parsedData.amount || parsedData.amount === null || typeof parsedData.amount !== 'number' || parsedData.amount <= 0)) {
            console.log('⚠️ [AI Chat] Transaction detected but amount is missing or invalid');
            
            // Generate appropriate message to ask for amount
            const transactionType = parsedData.type === 'income' ? 'pendapatan' : 'pengeluaran';
            const transactionName = parsedData.name || 'transaksi';
            
            aiMessage = `Saya sudah memahami ${transactionType} "${transactionName}" Anda, namun nominalnya belum disebutkan. Berapa jumlah nominal ${transactionType} tersebut?`;
            
            // Don't create transaction, just ask for amount
            transactionData = null;
          } else {
            // Invalid transaction data, use AI response as is
            console.log('⚠️ [AI Chat] Invalid transaction data structure');
            transactionData = null;
          }
        }
      } catch (parseError) {
        // Not valid JSON, try fallback
        console.log('⚠️ [AI Chat] Could not parse JSON from AI response:', parseError.message);
        console.log('⚠️ [AI Chat] JSON string that failed to parse:', jsonString?.substring(0, 200));
        transactionData = null;
        
        // Try fallback extraction from user message
        console.log('⚠️ [AI Chat] Attempting fallback: extracting transaction from user message...');
        const extractedTx = extractTransactionFromMessage(message);
        
        if (extractedTx && extractedTx.type && extractedTx.amount > 0 && extractedTx.category && extractedTx.name) {
          console.log('✅ [AI Chat] Fallback (from parse error): Successfully extracted transaction:', extractedTx);
          
          try {
            const { data: newTransaction, error: transactionError } = await adminClient
              .from('transactions')
              .insert({
                user_id: userId,
                type: extractedTx.type,
                amount: extractedTx.amount,
                name: extractedTx.name,
                category: extractedTx.category,
                description: extractedTx.description || extractedTx.name,
                date: new Date().toISOString()
              })
              .select()
              .single();

            if (!transactionError && newTransaction && newTransaction.id) {
              console.log(`✅ [AI Chat] Fallback (from parse error): Transaction created:`, newTransaction.id);
              aiMessage = `✅ Transaksi berhasil dibuat! ${extractedTx.type === 'income' ? 'Pendapatan' : 'Pengeluaran'} sebesar Rp ${extractedTx.amount.toLocaleString('id-ID')} untuk "${extractedTx.name}" telah ditambahkan.`;
              transactionData = {
                id: newTransaction.id,
                type: extractedTx.type,
                amount: extractedTx.amount,
                name: extractedTx.name,
                category: extractedTx.category,
                description: extractedTx.description || extractedTx.name
              };
              transactionsArray = [transactionData];
            }
          } catch (fallbackErr) {
            console.error('❌ [AI Chat] Fallback (from parse error) failed:', fallbackErr);
          }
        }
      }
    } else {
      // No JSON found in response
      console.log('⚠️ [AI Chat] No JSON found in AI response. AI might be having a conversation instead of creating transaction.');
      console.log('⚠️ [AI Chat] User message was:', message);
      console.log('⚠️ [AI Chat] AI response was:', aiResponse.substring(0, 200));
      
      // Check if AI response indicates success (but no JSON was found)
      const successIndicators = ['berhasil', 'success', 'berhasil dibuat', 'telah ditambahkan', 'telah dicatat'];
      const aiIndicatesSuccess = successIndicators.some(indicator => 
        aiResponse.toLowerCase().includes(indicator)
      );
      
      // Check if user message contains transaction keywords
      const transactionKeywords = [
        'dapat', 'menerima', 'gaji', 'income', 'pendapatan',
        'beli', 'membeli', 'bayar', 'membayar', 'pembayaran', 'expense', 'pengeluaran',
        'juta', 'ribu', 'rupiah'
      ];
      const hasTransactionKeywords = transactionKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
      );
      
      // Use fallback if: (1) AI indicates success but no JSON, OR (2) user message has transaction keywords
      // AND no transaction has been created yet
      if ((aiIndicatesSuccess || hasTransactionKeywords) && !transactionData && !transactionsArray) {
        console.log('⚠️ [AI Chat] AI response indicates success or user message has transaction keywords, but no JSON found.');
        console.log('⚠️ [AI Chat] Attempting fallback: extracting transaction from user message directly...');
        
        // Try to extract transaction info from user message as fallback
        const extractedTx = extractTransactionFromMessage(message);
        
        if (extractedTx && extractedTx.type && extractedTx.amount > 0 && extractedTx.category && extractedTx.name) {
          console.log('✅ [AI Chat] Fallback: Successfully extracted transaction from user message:', extractedTx);
          
          try {
            // Create transaction directly from extracted data
            const { data: newTransaction, error: transactionError } = await adminClient
              .from('transactions')
              .insert({
                user_id: userId,
                type: extractedTx.type,
                amount: extractedTx.amount,
                name: extractedTx.name,
                category: extractedTx.category,
                description: extractedTx.description || extractedTx.name,
                date: new Date().toISOString()
              })
              .select()
              .single();

            if (transactionError) {
              console.error('❌ [AI Chat] Fallback transaction creation error:', transactionError);
              // Continue with original AI response
            } else if (newTransaction && newTransaction.id) {
              console.log(`✅ [AI Chat] Fallback: Transaction created successfully:`, newTransaction.id);
              
              // Override AI message with success message
              aiMessage = `✅ Transaksi berhasil dibuat! ${extractedTx.type === 'income' ? 'Pendapatan' : 'Pengeluaran'} sebesar Rp ${extractedTx.amount.toLocaleString('id-ID')} untuk "${extractedTx.name}" telah ditambahkan.`;
              
              // Set transaction data
              transactionData = {
                id: newTransaction.id,
                type: extractedTx.type,
                amount: extractedTx.amount,
                name: extractedTx.name,
                category: extractedTx.category,
                description: extractedTx.description || extractedTx.name
              };
              
              transactionsArray = [transactionData];
            }
          } catch (fallbackErr) {
            console.error('❌ [AI Chat] Fallback error:', fallbackErr);
            // Continue with original AI response
          }
        } else {
          console.log('⚠️ [AI Chat] Fallback: Could not extract transaction from user message. Using AI response as is.');
        }
      } else if (hasTransactionKeywords) {
        console.log('⚠️ [AI Chat] User message contains transaction keywords but AI did not return JSON.');
      }
      
      // If this is a follow-up with amount only, try to create transaction from context
      if (shouldCreateTransactionFromContext && previousTransactionContext) {
        console.log(`🔧 [AI Chat] Attempting to create transaction from context + amount`);
        
        // Combine previous transaction context with the amount
        const combinedMessage = `${previousTransactionContext} ${message}`;
        console.log(`🔧 [AI Chat] Combined message: "${combinedMessage}"`);
        
        // Call AI again with combined message
        try {
          const followUpMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: combinedMessage }
          ];
          
          const followUpCompletion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: followUpMessages,
            temperature: 0.3,
            max_tokens: 1000,
            response_format: { type: "text" }
          });
          
          const followUpResponse = followUpCompletion.choices[0].message.content.trim();
          console.log(`🤖 [AI Chat] Follow-up AI response:`, followUpResponse);
          
          // Try to parse JSON from follow-up response
          let followUpJsonString = null;
          const followUpJsonMatch = followUpResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (followUpJsonMatch) {
            followUpJsonString = followUpJsonMatch[1];
          } else {
            const followUpDirectJsonMatch = followUpResponse.match(/\{[\s\S]*\}/);
            if (followUpDirectJsonMatch) {
              followUpJsonString = followUpDirectJsonMatch[0];
            }
          }
          
          if (followUpJsonString) {
            try {
              const followUpParsedData = JSON.parse(followUpJsonString);
              
              // Process the parsed transaction data
              if (followUpParsedData.type && 
                  (followUpParsedData.type === 'income' || followUpParsedData.type === 'expense') &&
                  followUpParsedData.amount && 
                  typeof followUpParsedData.amount === 'number' &&
                  followUpParsedData.amount > 0 &&
                  followUpParsedData.category &&
                  followUpParsedData.name) {
                
                console.log(`✅ [AI Chat] Follow-up transaction data parsed:`, followUpParsedData);
                
                try {
                  const { data: newTransaction, error: transactionError } = await adminClient
                    .from('transactions')
                    .insert({
                      user_id: userId,
                      type: followUpParsedData.type,
                      amount: followUpParsedData.amount,
                      name: followUpParsedData.name,
                      category: followUpParsedData.category,
                      description: followUpParsedData.description || followUpParsedData.name,
                      date: new Date().toISOString()
                    })
                    .select()
                    .single();

                  if (transactionError) {
                    console.error('❌ [AI Chat] Follow-up transaction creation error:', transactionError);
                    aiMessage = `Saya sudah memahami transaksi Anda, tapi terjadi error saat menyimpan: ${transactionError.message}`;
                    transactionData = null;
                    transactionsArray = null;
                  } else {
                    // Only proceed if transaction was actually created with an ID
                    if (!newTransaction || !newTransaction.id) {
                      console.error('❌ [AI Chat] Follow-up transaction creation returned no ID');
                      aiMessage = `Saya sudah memahami transaksi Anda, tapi terjadi error saat menyimpan. Silakan coba lagi.`;
                      transactionData = null;
                      transactionsArray = null;
                    } else {
                      console.log(`✅ [AI Chat] Follow-up transaction created successfully:`, newTransaction.id);
                      
                      // Only show success message if transaction was actually created with ID
                      aiMessage = `✅ Transaksi berhasil dibuat! ${followUpParsedData.type === 'income' ? 'Pendapatan' : 'Pengeluaran'} sebesar Rp ${followUpParsedData.amount.toLocaleString('id-ID')} untuk "${followUpParsedData.name}" telah ditambahkan.`;
                      
                      transactionData = {
                        id: newTransaction.id,
                        type: followUpParsedData.type,
                        amount: followUpParsedData.amount,
                        name: followUpParsedData.name,
                        category: followUpParsedData.category,
                        description: followUpParsedData.description || followUpParsedData.name
                      };
                      
                      transactionsArray = [transactionData];
                    }
                  }
                } catch (transactionErr) {
                  console.error('❌ [AI Chat] Error creating follow-up transaction:', transactionErr);
                  aiMessage = `Saya sudah memahami transaksi Anda, tapi terjadi error saat menyimpan. Silakan coba lagi.`;
                }
              }
            } catch (followUpParseError) {
              console.log('⚠️ [AI Chat] Could not parse JSON from follow-up response:', followUpParseError.message);
            }
          }
        } catch (followUpError) {
          console.error('❌ [AI Chat] Error processing follow-up:', followUpError);
        }
      }
    }

    // Save AI response to database
    // Store transaction data (single or array) in transaction_data field
    const transactionDataToStore = transactionsArray || transactionData;
    
    await adminClient
      .from('ai_chat_history')
      .insert({
        user_id: userId,
        message: aiMessage,
        role: 'assistant',
        transaction_data: transactionDataToStore
      });

    // Return response
    res.json({
      message: aiMessage,
      transaction: transactionData ? {
        id: transactionData.id || transactionData.transactionId,
        type: transactionData.type,
        amount: transactionData.amount,
        name: transactionData.name,
        category: transactionData.category,
        description: transactionData.description
      } : null,
      transactions: transactionsArray || (transactionData ? [transactionData] : null) // Always return array format for frontend
    });

  } catch (error) {
    console.error('❌ [AI Chat] Error:', error);
    res.status(500).json({ 
      error: 'Failed to process AI chat request',
      details: error.message 
    });
  }
};

// Get chat history
export const getChatHistory = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const adminClient = getServiceRoleClient();
    const { data: chatHistory, error } = await adminClient
      .from('ai_chat_history')
      .select('id, message, role, transaction_data, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ [AI Chat] Error fetching history:', error);
      return res.status(500).json({ error: 'Failed to fetch chat history' });
    }

    res.json({ history: chatHistory || [] });
  } catch (error) {
    console.error('❌ [AI Chat] Error:', error);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
};

