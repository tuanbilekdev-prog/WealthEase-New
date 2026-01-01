import express from 'express';
import passport from 'passport';
import { login, googleCallback } from '../controllers/authController.js';

const router = express.Router();

// Email/Password login
router.post('/login', login);

// Google OAuth routes
router.get(
  '/google',
  (req, res, next) => {
    // Check if Google OAuth is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(503).json({
        error: 'Google OAuth is not configured',
        message: 'Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file',
      });
    }
    // Check if strategy is registered
    if (!passport._strategies || !passport._strategies.google) {
      return res.status(503).json({
        error: 'Google OAuth strategy not initialized',
        message: 'Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file and restart the server',
      });
    }
    next();
  },
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    failureRedirect: '/auth/google/error'
  })
);

router.get(
  '/google/callback',
  (req, res, next) => {
    // Check if Google OAuth is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=oauth_not_configured`);
    }
    // Check if strategy is registered
    if (!passport._strategies || !passport._strategies.google) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=oauth_not_configured`);
    }
    next();
  },
  passport.authenticate('google', { session: false }),
  googleCallback
);

export default router;

