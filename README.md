# WealthEase - Full Stack Application

A modern full-stack application with Next.js frontend and Express backend, featuring email/password authentication and Google OAuth integration.

## 📁 Project Structure

```
.
├── backend/          # Node.js + Express API
│   ├── config/      # Configuration files (Passport)
│   ├── controllers/ # Route controllers
│   ├── routes/      # API routes
│   └── server.js    # Express server entry point
│
└── frontend/        # Next.js + TypeScript + Tailwind
    └── app/         # Next.js App Router
        ├── login/                 # Login page
        ├── dashboard/             # Authenticated landing page
        ├── dashboard/transactions # Transactions management
        └── dashboard/bills        # Smart Bill & Reminder Center
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Edit `.env` and add your configuration:
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-secret-key-here-change-in-production
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory (in a new terminal):
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file from the example:
```bash
cp .env.example .env.local
```

4. Edit `.env.local` if needed:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## 🗄️ Supabase Database Setup

This project uses Supabase (PostgreSQL) as the database. Follow these steps to set up:

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: `wealthease` (or your preferred name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
4. Wait for project to be created (~2 minutes)

### 2. Get API Credentials

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### 3. Run Database Migrations

1. In Supabase Dashboard, go to **SQL Editor**
2. Open `backend/migrations/001_initial_schema.sql`
3. Copy and paste the entire SQL into the editor
4. Click **Run** to execute
5. Verify tables are created in **Table Editor**

### 4. (Optional) Seed Dummy Data

**Option A: Using SQL**
1. Open `backend/migrations/002_dummy_data.sql` in SQL Editor
2. Replace `'test-user-1'` with your actual user ID from JWT token
3. Run the SQL

**Option B: Using Node.js Script**
```bash
cd backend
node scripts/seed-dummy-data.js
```

### 5. Update Environment Variables

Add Supabase credentials to `backend/.env`:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

And to `frontend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 6. Verify Connection

Restart your backend server. Check console for any Supabase connection errors.

## 🔐 Google OAuth Setup

To enable Google OAuth login:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URI: `http://localhost:5000/auth/google/callback`
7. Copy the Client ID and Client Secret to your backend `.env` file

## 🎨 Features

### Frontend
- ✅ Modern, minimal, and responsive login page
- ✅ Email/password authentication
- ✅ Google OAuth integration
- ✅ Dashboard page with user info and financial snapshot
- ✅ Transactions page with balance card, form, and recent list
- ✅ Smart Bill & Reminder Center with reminders & auto balance updates
- ✅ Custom color theme (Emerald Green, Dark Green, Soft Mint, Stone Gray)
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling

### Backend
- ✅ Express REST API
- ✅ JWT token generation
- ✅ Google OAuth with Passport.js
- ✅ **Supabase PostgreSQL database** for persistent storage
- ✅ Transactions API with summary endpoints
- ✅ Bills API with reminder completion + balance adjustments
- ✅ Auto-calculated balance via database triggers
- ✅ CORS enabled for frontend communication
- ✅ Organized folder structure (controllers, routes, config)

## 📝 API Endpoints

### POST `/auth/login`
Email/password login endpoint.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "email": "user@example.com"
  }
}
```

### GET `/auth/google`
Initiates Google OAuth flow. Redirects user to Google login.

### GET `/auth/google/callback`
Google OAuth callback endpoint. Redirects to frontend dashboard with token.

### User API

- **GET `/user/me`** — returns current user data:
  ```json
  {
    "id": "1",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  }
  ```
- **PATCH `/user/theme`** — save theme preference:
  ```json
  {
    "theme": "light" | "dark"
  }
  ```

### Transactions API

- **POST `/transactions`**
```json
{
  "type": "income",
  "name": "Consulting fee",
  "category": "Services",
  "amount": 5000000,
  "description": "New investment",
  "date": "2025-01-15"
}
```
- **GET `/transactions`** — returns full transaction list
- **GET `/transactions/recent`** — returns 10 most recent records
- **GET `/transactions/summary`** — returns totals:
  ```json
  {
    "total_income": 5000000,
    "total_expense": 1500000,
    "balance": 3500000
  }
  ```
- **POST `/balance/decrease`**
  ```json
  {
    "amount": 150000,
    "description": "Bill: Internet subscription"
  }
  ```
  Deducts balance by creating an expense transaction and returns the updated summary.

### Bills API

- **POST `/bills`**
  ```json
  {
    "billName": "Internet",
    "amount": 150000,
    "dueDate": "2025-01-20",
    "category": "utilities",
    "description": "Monthly plan"
  }
  ```
- **GET `/bills/active`** — list of bills not yet completed
- **GET `/bills/completed`** — completed reminders
- **PATCH `/bills/:id/complete`** — marks a bill finished and returns `{ "success": true, "amount": 150000 }`

### Frontend Pages

#### Transactions Page
- Location: `http://localhost:3000/dashboard/transactions`
- Features:
  - Add transaction form (income/expense)
  - Current balance card (data from `/transactions/summary`)
  - Recent transactions list (data from `/transactions/recent`)
  - Real-time refresh without page reload

#### Smart Bill & Reminder Center
- Location: `http://localhost:3000/dashboard/bills`
- Features:
  - Add new bills with due dates
  - Active reminders list
  - Completed reminders list
  - Mark bills as completed (auto-decreases balance)
  - Real-time balance updates

#### Settings Page
- Location: `http://localhost:3000/dashboard/settings`
- Features:
  - User profile information (name, email, role)
  - Theme switcher (Light/Dark/System)
  - Theme preference saved in localStorage
  - Dark mode with custom color scheme

## 🧪 Testing

1. **Email/Password Login:**
   - Open `http://localhost:3000/login`
   - Enter any email and password
   - Click "Login"
   - You should be redirected to the dashboard

2. **Google OAuth Login:**
   - Click "Login With Google" button
   - Complete Google authentication
   - You will be redirected to the dashboard with a token

## 🛠️ Development

- Backend runs with `node --watch` for auto-reload
- Frontend runs with Next.js dev server (hot reload)
- Both servers need to be running simultaneously

## 📦 Technologies Used

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React 18

### Backend
- Node.js
- Express.js
- Passport.js
- Passport Google OAuth20
- JSON Web Token (JWT)
- Supabase (PostgreSQL)
- CORS

## 🔒 Security Notes

- Change `JWT_SECRET` to a strong random string in production
- **Never expose `SUPABASE_SERVICE_ROLE_KEY`** to frontend or commit to Git
- Use environment variables for all sensitive data
- Implement proper password hashing (bcrypt) in production
- Add rate limiting for production
- Validate and sanitize all inputs
- Use HTTPS in production
- Configure Row Level Security (RLS) policies in Supabase for production

## 📊 Database Schema

The database consists of 4 main tables:

- **users**: User profiles (id, name, email, role, theme)
- **transactions**: Financial transactions (income/expense)
- **bills**: Bill reminders and tracking
- **balance**: Denormalized balance table (auto-updated via trigger)

See `backend/migrations/001_initial_schema.sql` for full schema details.

## 📄 License

ISC

