# 🚀 Quick Start: Deploy ke GitHub & Vercel

## ⚡ Langkah Cepat (5 Menit)

### 1️⃣ Setup GitHub

```bash
# Di folder root project
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/wealthease.git
git push -u origin main
```

**Ganti `YOUR_USERNAME` dengan username GitHub Anda!**

### 2️⃣ Deploy Frontend ke Vercel

1. Buka [vercel.com](https://vercel.com) → Login
2. **Add New Project** → Pilih repository GitHub Anda
3. **Settings**:
   - Root Directory: `./frontend`
   - Framework: Next.js (auto-detect)
4. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://wealthease-backend.vercel.app
   ```
   *(Update setelah backend deploy)*
5. **Deploy** ✅

### 3️⃣ Deploy Backend ke Vercel

1. Di Vercel, **Add New Project** lagi → Pilih repository yang sama
2. **Settings**:
   - Root Directory: `./backend`
   - Framework: Other
3. **Environment Variables** (COPY dari `.env` lokal):
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   JWT_SECRET=...
   FRONTEND_URL=https://wealthease.vercel.app
   BACKEND_URL=https://wealthease-backend.vercel.app
   SUPABASE_URL=...
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   OPENAI_API_KEY=...
   ```
4. **Deploy** ✅

### 4️⃣ Update URLs

Setelah kedua project deploy:

1. **Backend Vercel** → Copy URL (misalnya: `https://wealthease-backend-xxx.vercel.app`)
2. **Frontend Vercel** → Settings → Environment Variables → Update `NEXT_PUBLIC_API_URL`
3. **Backend Vercel** → Settings → Environment Variables → Update `FRONTEND_URL` dan `BACKEND_URL`
4. **Redeploy** kedua project

### 5️⃣ Selesai! 🎉

Aplikasi Anda sudah online di:
- Frontend: `https://wealthease.vercel.app`
- Backend: `https://wealthease-backend.vercel.app`

---

📖 **Untuk panduan detail, lihat `DEPLOYMENT_GUIDE.md`**

