import app from './app.js';
import db from './utils/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Test DB connection before starting server
db`SELECT 1`.then(() => {
  console.log('Database connected successfully to Supabase');
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});