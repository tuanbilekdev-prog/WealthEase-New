# 🚀 Panduan Deploy WealthEase ke GitHub & Vercel

Panduan lengkap untuk hosting aplikasi WealthEase menggunakan GitHub dan Vercel.

## 📋 Prerequisites

- Akun GitHub (gratis)
- Akun Vercel (gratis)
- Git terinstall di komputer
- Node.js & npm terinstall

---

## 📝 BAGIAN 1: Setup GitHub Repository

### 1.1 Buat Repository Baru di GitHub

1. Buka [GitHub.com](https://github.com) dan login
2. Klik **"+"** di kanan atas → **"New repository"**
3. Isi form:
   - **Repository name**: `wealthease` (atau nama lain)
   - **Description**: `WealthEase - Financial Management PWA`
   - **Visibility**: Public (atau Private jika ingin private)
   - **JANGAN centang** "Add a README file" (karena kita sudah punya)
4. Klik **"Create repository"**

### 1.2 Inisialisasi Git di Project Lokal

Buka terminal/command prompt di folder project root:

```bash
# Pastikan Anda di folder root project
cd "D:\Kuliah\Semester 3\FSD\projek terbaru\Newest WealthEase"

# Inisialisasi git (jika belum)
git init

# Tambahkan semua file ke staging
git add .

# Commit pertama
git commit -m "Initial commit: WealthEase PWA"

# Tambahkan remote GitHub (ganti YOUR_USERNAME dan REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/wealthease.git

# Push ke GitHub
git branch -M main
git push -u origin main
```

**Catatan**: Ganti `YOUR_USERNAME` dengan username GitHub Anda dan `REPO_NAME` dengan nama repository yang Anda buat.

---

## 🌐 BAGIAN 2: Deploy Frontend ke Vercel

### 2.1 Import Project dari GitHub

1. Buka [vercel.com](https://vercel.com) dan login (bisa pakai GitHub account)
2. Klik **"Add New..."** → **"Project"**
3. Pilih repository `wealthease` yang sudah Anda buat
4. Klik **"Import"**

### 2.2 Konfigurasi Project Frontend

1. Di halaman **"Configure Project"**:
   - **Framework Preset**: Next.js (otomatis terdeteksi)
   - **Root Directory**: `./frontend` (PENTING!)
   - **Build Command**: `npm run build` (otomatis)
   - **Output Directory**: `.next` (otomatis)
   - **Install Command**: `npm install` (otomatis)

2. Klik **"Environment Variables"** untuk menambahkan:

   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app
   ```

   (URL backend akan kita dapat setelah deploy backend di langkah berikutnya)

3. Klik **"Deploy"**

### 2.3 Update Environment Variable Setelah Backend Deploy

Setelah backend di-deploy, kembali ke Vercel:
1. Project → Settings → Environment Variables
2. Edit `NEXT_PUBLIC_API_URL` menjadi URL backend yang baru
3. Redeploy project

---

## 🔧 BAGIAN 3: Deploy Backend ke Vercel

### 3.1 Buat Project Backend Baru di Vercel

1. Kembali ke dashboard Vercel
2. Klik **"Add New..."** → **"Project"**
3. Pilih repository yang sama (`wealthease`)
4. Klik **"Import"**

### 3.2 Konfigurasi Project Backend

1. **Framework Preset**: Other
2. **Root Directory**: `./backend`
3. **Build Command**: (kosongkan atau `npm install`)
4. **Output Directory**: (kosongkan)
5. **Install Command**: `npm install`

6. **Environment Variables** - Tambahkan semua ini:

   ```
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   JWT_SECRET=your-jwt-secret-key
   FRONTEND_URL=https://your-frontend.vercel.app
   BACKEND_URL=https://your-backend.vercel.app
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   OPENAI_API_KEY=your-openai-api-key
   PORT=5000
   ```

7. **Advanced Settings**:
   - **Node.js Version**: 18.x atau 20.x

### 3.3 Buat file `vercel.json` untuk Backend

Buat file `backend/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 3.4 Deploy Backend

1. Commit dan push file `vercel.json` ke GitHub:
   ```bash
   git add backend/vercel.json
   git commit -m "Add Vercel config for backend"
   git push
   ```

2. Kembali ke Vercel dan klik **"Deploy"**
3. Tunggu hingga deploy selesai
4. Copy URL backend yang diberikan (misalnya: `https://wealthease-backend.vercel.app`)

---

## 🔄 BAGIAN 4: Update Environment Variables

### 4.1 Update Frontend Environment Variable

1. Buka project **Frontend** di Vercel
2. Settings → Environment Variables
3. Edit `NEXT_PUBLIC_API_URL` menjadi URL backend yang baru:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app
   ```
4. Klik **"Redeploy"**

### 4.2 Update Backend Environment Variable

1. Buka project **Backend** di Vercel
2. Settings → Environment Variables
3. Update `FRONTEND_URL` dan `BACKEND_URL`:
   ```
   FRONTEND_URL=https://your-frontend.vercel.app
   BACKEND_URL=https://your-backend.vercel.app
   ```
4. Klik **"Redeploy"**

---

## ✅ BAGIAN 5: Verifikasi Deployment

### 5.1 Test Frontend

1. Buka URL frontend (misalnya: `https://wealthease.vercel.app`)
2. Pastikan halaman login muncul
3. Coba login

### 5.2 Test Backend

1. Buka URL backend + `/` (misalnya: `https://wealthease-backend.vercel.app/`)
2. Harus muncul: `{"message":"WealthEase API is running"}`

### 5.3 Test Integrasi

1. Di frontend, coba login
2. Cek apakah API call berhasil
3. Jika ada error CORS, pastikan `FRONTEND_URL` di backend sudah benar

---

## 🐛 Troubleshooting

### Error: "Module not found"
- Pastikan `Root Directory` di Vercel sudah benar (`./frontend` atau `./backend`)

### Error: "Environment variable not found"
- Pastikan semua environment variables sudah di-set di Vercel
- Redeploy setelah menambah environment variable

### Error: CORS
- Pastikan `FRONTEND_URL` di backend sesuai dengan URL frontend yang di-deploy
- Pastikan `NEXT_PUBLIC_API_URL` di frontend sesuai dengan URL backend

### Backend tidak bisa diakses
- Cek apakah file `vercel.json` sudah dibuat
- Pastikan `server.js` ada di root directory backend

### PWA tidak berfungsi
- Pastikan menggunakan HTTPS (Vercel otomatis HTTPS)
- Cek `manifest.json` sudah benar

---

## 📌 Checklist Deployment

- [ ] Repository GitHub sudah dibuat
- [ ] Code sudah di-push ke GitHub
- [ ] Frontend project sudah dibuat di Vercel
- [ ] Backend project sudah dibuat di Vercel
- [ ] `vercel.json` sudah dibuat untuk backend
- [ ] Semua environment variables sudah di-set
- [ ] Frontend dan Backend sudah di-deploy
- [ ] URL sudah di-update di environment variables
- [ ] Aplikasi sudah di-test dan berfungsi

---

## 🔗 Link Penting

- **GitHub**: https://github.com
- **Vercel**: https://vercel.com
- **Supabase Dashboard**: https://app.supabase.com
- **Google Cloud Console**: https://console.cloud.google.com

---

## 📝 Catatan

1. **Gratis**: Vercel dan GitHub memberikan hosting gratis dengan limit tertentu
2. **Auto Deploy**: Setiap push ke GitHub akan auto-deploy ke Vercel (jika diaktifkan)
3. **Custom Domain**: Bisa tambahkan custom domain di Vercel (Settings → Domains)
4. **Environment Variables**: Jangan commit file `.env` ke GitHub!

---

**Selamat! Aplikasi Anda sudah online! 🎉**

