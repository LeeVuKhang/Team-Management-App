import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("FATAL: DATABASE_URL is not defined in .env file");
}

const db = postgres(connectionString, {
  ssl: 'require', 
  max: 10,            
  idle_timeout: 20,   
  connect_timeout: 30,  // Increased from 10 to 30 seconds for slow connections
});

export default db;