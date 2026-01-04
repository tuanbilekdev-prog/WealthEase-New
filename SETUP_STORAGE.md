# 🗄️ Setup Supabase Storage untuk Upload Foto Profile

Panduan lengkap untuk setup Supabase Storage bucket agar fitur upload foto profile bisa berfungsi.

## 📋 Prerequisites

- Supabase project sudah dibuat
- Environment variables sudah di-set (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

---

## 🚀 Langkah-langkah Setup

### 1. Buat Storage Bucket di Supabase

1. Buka **Supabase Dashboard**: https://app.supabase.com
2. Pilih project Anda
3. Klik **Storage** di sidebar kiri
4. Klik **"New bucket"** atau **"Create bucket"**
5. Isi form:
   - **Name**: `profile-pictures` (harus sama persis)
   - **Public bucket**: ✅ **Centang** (agar foto bisa diakses via public URL)
   - **File size limit**: `5242880` (5MB dalam bytes) atau pilih "5 MB"
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/png`
     - `image/gif`
     - `image/webp`
6. Klik **"Create bucket"**

---

### 2. Setup Storage Policies (RLS)

Setelah bucket dibuat, kita perlu setup policies agar:
- User bisa upload foto mereka sendiri
- Foto bisa diakses secara public (untuk ditampilkan di web)

#### Via Supabase Dashboard:

1. Di halaman **Storage**, klik bucket `profile-pictures`
2. Klik tab **"Policies"**
3. Klik **"New Policy"**

**Policy 1: Allow Public Read Access**
- **Policy name**: `Public can read avatars`
- **Allowed operation**: `SELECT`
- **Policy definition**:
  ```sql
  bucket_id = 'profile-pictures'
  ```
- Klik **"Review"** → **"Save policy"**

**Policy 2: Allow Authenticated Upload**
- **Policy name**: `Users can upload own avatar`
- **Allowed operation**: `INSERT`
- **Policy definition**:
  ```sql
  bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]
  ```
- Klik **"Review"** → **"Save policy"**

**Policy 3: Allow Authenticated Update**
- **Policy name**: `Users can update own avatar`
- **Allowed operation**: `UPDATE`
- **Policy definition**:
  ```sql
  bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]
  ```
- Klik **"Review"** → **"Save policy"**

**Policy 4: Allow Authenticated Delete**
- **Policy name**: `Users can delete own avatar`
- **Allowed operation**: `DELETE`
- **Policy definition**:
  ```sql
  bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]
  ```
- Klik **"Review"** → **"Save policy"**

---

### 3. Alternatif: Setup via SQL Editor

Jika lebih suka menggunakan SQL, jalankan script di `backend/migrations/011_create_storage_bucket.sql`:

1. Buka **SQL Editor** di Supabase Dashboard
2. Copy isi file `backend/migrations/011_create_storage_bucket.sql`
3. Paste ke SQL Editor
4. Klik **"Run"**

**Catatan**: Bucket harus dibuat via Dashboard terlebih dahulu, SQL hanya untuk policies.

---

### 4. Verifikasi Setup

1. **Cek Bucket**:
   - Buka Storage → `profile-pictures`
   - Pastikan bucket ada dan status "Public"

2. **Cek Policies**:
   - Buka Storage → `profile-pictures` → Tab "Policies"
   - Pastikan ada 4 policies (SELECT, INSERT, UPDATE, DELETE)

3. **Test Upload**:
   - Buka aplikasi → Settings → Upload foto
   - Cek apakah foto berhasil di-upload
   - Cek di Supabase Storage apakah file muncul

---

## 🔧 Troubleshooting

### Error: "Bucket not found"
- **Solusi**: Pastikan bucket `profile-pictures` sudah dibuat di Supabase Dashboard

### Error: "Permission denied" atau "RLS policy violation"
- **Solusi**: 
  1. Pastikan policies sudah dibuat dengan benar
  2. Pastikan bucket status "Public"
  3. Pastikan menggunakan `SUPABASE_SERVICE_ROLE_KEY` di backend (bukan anon key)

### Error: "File size too large"
- **Solusi**: 
  1. Pastikan file < 5MB
  2. Cek file size limit di bucket settings

### Error: "Invalid file type"
- **Solusi**: Pastikan file adalah image (JPG, PNG, GIF, WEBP)

### Foto tidak muncul di web
- **Solusi**:
  1. Pastikan bucket status "Public"
  2. Cek apakah `avatar_url` sudah tersimpan di database (table `profiles`)
  3. Cek console browser untuk error loading image
  4. Pastikan URL foto benar (bisa test dengan buka URL langsung di browser)

---

## 📝 Checklist

- [ ] Bucket `profile-pictures` sudah dibuat
- [ ] Bucket status "Public" ✅
- [ ] File size limit: 5MB
- [ ] Allowed MIME types sudah di-set
- [ ] Policies sudah dibuat (SELECT, INSERT, UPDATE, DELETE)
- [ ] Environment variables sudah di-set di Vercel
- [ ] Backend sudah di-redeploy
- [ ] Test upload foto berhasil
- [ ] Foto muncul di web

---

## 🔗 Link Penting

- **Supabase Dashboard**: https://app.supabase.com
- **Storage Documentation**: https://supabase.com/docs/guides/storage
- **Storage Policies**: https://supabase.com/docs/guides/storage/security/access-control

---

## 📌 Catatan

1. **Service Role Key**: Backend menggunakan `SUPABASE_SERVICE_ROLE_KEY` untuk bypass RLS, jadi policies di atas sebenarnya opsional untuk backend. Tapi tetap disarankan untuk security.

2. **Public Bucket**: Bucket harus public agar foto bisa diakses via public URL dan ditampilkan di web.

3. **File Path**: File disimpan di path `avatars/{userId}-{timestamp}.{ext}` di dalam bucket.

4. **Database**: URL foto disimpan di kolom `avatar_url` di table `profiles`.

---

**Setelah setup selesai, fitur upload foto profile akan berfungsi! 🎉**

