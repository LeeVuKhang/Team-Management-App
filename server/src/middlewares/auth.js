import jwt from 'jsonwebtoken';

/**
 * JWT Authentication Middleware
 * Verifies JWT token from HTTP-only cookie
 */

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = { 
      id: decoded.userId,
      email: decoded.email 
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.',
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.',
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Optional Authentication Middleware
 * Verifies token if present but doesn't block if missing
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { 
        id: decoded.userId,
        email: decoded.email 
      };
    }
    
    next();
  } catch (error) {
    next();
  }
};

/**
 * Mock Authentication Middleware (FOR TESTING ONLY)
 * Simulates authenticated user without requiring token
 * ⚠️ REMOVE IN PRODUCTION
 */
export const mockAuth = (req, res, next) => {
  req.user = { id: 1 };
  console.warn('⚠️  Using MOCK AUTH - User ID 1 (Replace with verifyToken in production)');
  next();
};
