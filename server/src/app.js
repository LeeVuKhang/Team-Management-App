import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.js';

const app = express();

// Security Middleware
app.use(helmet()); // Secure HTTP headers
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5174' // Vite alternative port
  ],
  credentials: true, // Allow cookies
}));

// Parsing Middleware
app.use(express.json());
app.use(cookieParser()); // Essential for HTTP-only JWTs 

// Routes
app.use('/api/v1', routes);

// Centralized Error Handling
app.use(errorHandler);

export default app;