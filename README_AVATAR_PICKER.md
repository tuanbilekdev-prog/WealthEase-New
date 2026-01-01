# Avatar Picker Feature

Fitur sederhana untuk memilih avatar dari preset emoji/icons yang tersedia.

## 📋 Fitur

- ✅ Pilih avatar dari 24 preset icon bertema keuangan
- ✅ Simpan pilihan avatar ke database
- ✅ Tampilkan avatar di seluruh aplikasi
- ✅ Tidak perlu upload file (tanpa Supabase Storage)
- ✅ Tidak perlu environment variables tambahan
- ✅ Simple dan mudah digunakan

## 🚀 Setup

### 1. Update Database Schema

Jalankan migration di Supabase SQL Editor:

**File:** `backend/migrations/008_update_profiles_avatar_selected.sql`

Atau jalankan SQL ini:
```sql
-- Add avatar_selected column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_selected INTEGER CHECK (avatar_selected >= 1 AND avatar_selected <= 24);
```

### 2. Restart Backend Server

Setelah migration, restart backend server untuk menerapkan perubahan.

## 📝 Cara Menggunakan

1. Buka halaman **Settings** (`/dashboard/settings`)
2. Pilih avatar dari 24 pilihan icon bertema keuangan yang tersedia
3. Avatar akan langsung tersimpan dan tampil di seluruh aplikasi

## 🎨 Preset Avatars

Tersedia 24 pilihan avatar bertema keuangan:

1. 💰 Money Bag
2. 💵 Dollar
3. 💴 Yen
4. 💶 Euro
5. 💷 Pound
6. 💸 Money Wings
7. 💳 Credit Card
8. 💎 Diamond
9. 🏦 Bank
10. 💼 Briefcase
11. 📈 Chart Up
12. 📊 Chart
13. 📉 Chart Down
14. 💱 Currency Exchange
15. 🪙 Coin
16. 💲 Dollar Sign
17. 🔄 Exchange
18. 💹 Yen Chart
19. 📅 Calendar
20. 🏛️ Building
21. 🎯 Target
22. ⚖️ Balance
23. 📋 Clipboard
24. ✅ Checkmark

## 🔄 Prioritas Tampilan Avatar

1. **Preset Avatar** (jika user sudah memilih)
2. **Google Profile Picture** (jika login dengan Google)
3. **Initial Letter** (huruf pertama nama/email sebagai fallback)

## 📁 File yang Terkait

### Frontend
- `frontend/components/AvatarProfile.tsx` - Komponen untuk menampilkan avatar
- `frontend/components/settings/AvatarPicker.tsx` - Komponen untuk memilih avatar
- `frontend/app/dashboard/settings/page.tsx` - Halaman settings

### Backend
- `backend/controllers/userController.js` - Controller untuk update avatar
- `backend/routes/userRoutes.js` - Route untuk endpoint avatar
- `backend/migrations/008_update_profiles_avatar_selected.sql` - Migration database

## 🔌 API Endpoints

### PUT `/user/avatar`
Update avatar selection user.

**Request:**
```json
{
  "avatar_selected": 5
}
```

**Response:**
```json
{
  "success": true,
  "avatar_selected": 5
}
```

## ✅ Keuntungan Fitur Ini

1. **Tidak perlu setup storage** - Tidak perlu Supabase Storage bucket
2. **Tidak perlu environment variables tambahan** - Hanya perlu database yang sudah ada
3. **Simple dan cepat** - Hanya simpan angka (1-24) di database
4. **Tampilan compact** - Ukuran lebih kecil dan rapi di halaman settings (grid 12 kolom)
5. **Tema keuangan** - Icon yang relevan dengan aplikasi finansial
6. **Tidak ada file upload** - Tidak perlu handle file upload/complexity
7. **Lightweight** - Avatar hanya emoji/icons, tidak perlu storage besar

