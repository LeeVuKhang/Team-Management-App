import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

/**
 * Passport Configuration for Google OAuth 2.0
 * 
 * Environment Variables Required:
 * - GOOGLE_CLIENT_ID: OAuth 2.0 Client ID from Google Cloud Console
 * - GOOGLE_CLIENT_SECRET: OAuth 2.0 Client Secret
 */

// Validate required environment variables
const requiredEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.warn(`⚠️ Warning: ${varName} is not set in environment variables`);
  }
});

/**
 * Google OAuth 2.0 Strategy Configuration
 * 
 * Flow:
 * 1. User clicks "Login with Google"
 * 2. Redirect to Google's consent screen
 * 3. Google redirects back to callbackURL with authorization code
 * 4. Passport exchanges code for tokens and user profile
 * 5. Callback function processes user data
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: '/api/v1/auth/google/callback',
      scope: ['profile', 'email'],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      /**
       * Google OAuth Callback
       * 
       * Profile structure:
       * {
       *   id: '123456789',
       *   displayName: 'John Doe',
       *   name: { familyName: 'Doe', givenName: 'John' },
       *   emails: [{ value: 'john@gmail.com', verified: true }],
       *   photos: [{ value: 'https://...' }],
       *   provider: 'google'
       * }
       */
      
      // TODO: Implement user creation/lookup logic in Step 2
      console.log('=== Google OAuth Callback ===');
      console.log('Google ID:', profile.id);
      console.log('Display Name:', profile.displayName);
      console.log('Email:', profile.emails?.[0]?.value);
      console.log('Avatar:', profile.photos?.[0]?.value);
      console.log('============================');
      
      // Placeholder: Pass profile to next step
      return done(null, profile);
    }
  )
);

/**
 * Serialize/Deserialize user
 * Note: We use JWT tokens instead of sessions,
 * but these are required by Passport
 */
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

export default passport;
