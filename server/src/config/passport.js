import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import db from '../utils/db.js';

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
 * 5. Callback function processes user data (find/create/link)
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: '/api/v1/auth/google/callback',
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // ========================================
        // Extract profile information from Google
        // ========================================
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value;
        const displayName = profile.displayName || email?.split('@')[0] || 'User';
        const avatar = profile.photos?.[0]?.value || null;

        console.log('=== Google OAuth Callback ===');
        console.log('Google ID:', googleId);
        console.log('Email:', email);
        console.log('Display Name:', displayName);
        console.log('Avatar URL:', avatar);

        // Validate required fields
        if (!email) {
          console.error('❌ Google OAuth Error: No email provided');
          return done(new Error('Google account does not have an email address'), null);
        }

        // ========================================
        // Query 1: Find user by Google ID
        // ========================================
        console.log('🔍 Query 1: Searching by Google ID...');
        const [existingGoogleUser] = await db`
          SELECT id, username, email, avatar_url, google_id, auth_provider, created_at
          FROM users
          WHERE google_id = ${googleId}
        `;

        if (existingGoogleUser) {
          console.log('✅ Found existing user by Google ID:', existingGoogleUser.email);
          return done(null, existingGoogleUser);
        }

        // ========================================
        // Query 2: Find user by Email (Link account)
        // ========================================
        console.log('🔍 Query 2: Searching by Email...');
        const [existingEmailUser] = await db`
          SELECT id, username, email, avatar_url, google_id, auth_provider, created_at
          FROM users
          WHERE email = ${email.toLowerCase()}
        `;

        if (existingEmailUser) {
          // User exists with this email but hasn't linked Google yet
          console.log('🔗 Found existing user by Email, linking Google account...');
          
          const [updatedUser] = await db`
            UPDATE users
            SET 
              google_id = ${googleId},
              avatar_url = COALESCE(avatar_url, ${avatar}),
              auth_provider = CASE 
                WHEN auth_provider = 'local' AND password_hash IS NOT NULL 
                THEN 'local' 
                ELSE 'google' 
              END,
              updated_at = NOW()
            WHERE email = ${email.toLowerCase()}
            RETURNING id, username, email, avatar_url, google_id, auth_provider, created_at
          `;

          console.log('✅ Successfully linked Google account to existing user:', updatedUser.email);
          return done(null, updatedUser);
        }

        // ========================================
        // Query 3: Create new user (First time Google login)
        // ========================================
        console.log('📝 Query 3: Creating new user...');
        const [newUser] = await db`
          INSERT INTO users (
            username, 
            email, 
            google_id, 
            avatar_url, 
            auth_provider, 
            password_hash
          )
          VALUES (
            ${displayName}, 
            ${email.toLowerCase()}, 
            ${googleId}, 
            ${avatar}, 
            'google', 
            NULL
          )
          RETURNING id, username, email, avatar_url, google_id, auth_provider, created_at
        `;

        console.log('✅ Successfully created new user via Google OAuth:', newUser.email);
        console.log('============================');
        
        return done(null, newUser);

      } catch (error) {
        console.error('❌ Google OAuth Database Error:', error.message);
        console.error('Stack:', error.stack);
        return done(error, null);
      }
    }
  )
);

/**
 * Serialize/Deserialize user
 * Note: We use JWT tokens instead of sessions,
 * but these are required by Passport initialization
 */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const [user] = await db`
      SELECT id, username, email, avatar_url, google_id, auth_provider, created_at
      FROM users
      WHERE id = ${id}
    `;
    done(null, user || null);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
