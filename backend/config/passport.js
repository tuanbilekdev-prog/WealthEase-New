import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Ensure .env loaded even if this module is evaluated before server.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Debug: Check environment variables
const hasClientID = !!process.env.GOOGLE_CLIENT_ID;
const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;

// Only initialize Google OAuth if credentials are provided
if (hasClientID && hasClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        // In a real app, you would save the user to the database here
        // For now, we'll just return the profile
        const user = {
          id: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          picture: profile.photos[0].value,
        };
        return done(null, user);
      }
    )
  );
} else {
  console.warn('⚠️  Google OAuth credentials not found. Google login will not work.');
  console.warn('   GOOGLE_CLIENT_ID:', hasClientID ? '✅ Found' : '❌ Missing');
  console.warn('   GOOGLE_CLIENT_SECRET:', hasClientSecret ? '✅ Found' : '❌ Missing');
  console.warn('   Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file to enable Google OAuth.');
}

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

