import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables first with explicit path
const envResult = dotenv.config({ path: join(__dirname, '.env') });

if (envResult.error) {
  console.warn('⚠️  Warning loading .env:', envResult.error.message);
}

// Debug: Check if env vars are loaded (only show first few chars for security)
console.log('🔍 Environment check:');
console.log('   GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'NOT FOUND');
console.log('   GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET (hidden)' : 'NOT FOUND');
console.log('   OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET (hidden)' : 'NOT FOUND');

import passport from 'passport';
import './config/passport.js';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactionRoutes.js';
import billRoutes from './routes/billRoutes.js';
import userRoutes from './routes/userRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import aiChatRoutes from './routes/aiChatRoutes.js';
import aiChatBillRoutes from './routes/aiChatBillRoutes.js';
import aiForecastRoutes from './routes/aiForecastRoutes.js';
import { decreaseBalance } from './controllers/balanceController.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import clearDataRoutes from './routes/clearDataRoutes.js';
import { verifyToken } from './middleware/authMiddleware.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Middleware
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('localhost')) {
      return callback(null, true);
    } else {
      console.log('⚠️ CORS Warning: Request from unknown origin:', origin);
      return callback(null, true); // Temporarily allow all for debugging
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Routes
app.use('/auth', authRoutes);
app.use('/transactions', transactionRoutes);
app.use('/bills', billRoutes);
app.use('/user', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/ai-chat-bill', aiChatBillRoutes);
app.use('/api/ai-forecast', aiForecastRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/clear-data', clearDataRoutes);
app.post('/balance/decrease', verifyToken, decreaseBalance);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'WealthEase API is running' });
});

// 404 handler - must be after all routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Global error handler (4 parameters = error handler)
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Only listen on serverless in local development
// In Vercel, the serverless function will handle the app
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
    console.log(`📝 Health check: http://localhost:${PORT}`);
    console.log(`🔐 Auth endpoint: http://localhost:${PORT}/auth/login`);
    console.log(`🤖 AI Chat endpoint: http://localhost:${PORT}/api/ai-chat/chat`);
    console.log(`📋 AI Chat Bill endpoint: http://localhost:${PORT}/api/ai-chat-bill/chat`);
    console.log(`🔮 AI Forecast endpoint: http://localhost:${PORT}/api/ai-forecast`);
    console.log(`📊 Analytics endpoint: http://localhost:${PORT}/api/analytics/summary`);
  });
}

// Error handling
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Export app for Vercel serverless
export default app;

