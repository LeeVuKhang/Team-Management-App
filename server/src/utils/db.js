import knex from 'knex';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASS,
  DB_NAME,
} = process.env;

// 1. Strict Environment Validation
// Prevents the app from starting with invalid DB config, failing fast and strictly.
const requiredEnv = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASS', 'DB_NAME'];
requiredEnv.forEach((k) => {
  if (!process.env[k]) {
    throw new Error(`[db] Critical Error: Missing ${k}. Please define it in server/.env`);
  }
});

// 2. Database Connection Configuration
const db = knex({
  client: 'pg', // Requires 'pg' library to be installed
  connection: {
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    // Supabase (and most cloud PGs) requires SSL. 
    // rejectUnauthorized: false is common for dev/simple setups but consider CA certs for strict prod.
    ssl: { rejectUnauthorized: false }, 
  },
  pool: {
    min: 2, // Keep a minimum number of connections open
    max: 15, // Cap the pool to prevent starving the database
    // acquireTimeoutMillis: 30000,
    // createTimeoutMillis: 3000,
    // idleTimeoutMillis: 30000,
    // reapIntervalMillis: 1000,
  },
  // Optional: Debug mode for development to see raw SQL queries
  debug: process.env.NODE_ENV === 'development',
});

// 3. Connection Health Check (Optional but recommended)
// Logs a success message if connection is established, or error if not.
db.raw('SELECT 1')
  .then(() => {
    console.log('[db] Database connected successfully.');
  })
  .catch((err) => {
    console.error('[db] Database connection failed:', err);
    process.exit(1); // Exit process on DB failure
  });

export default db;