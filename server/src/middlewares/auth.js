import db from '../utils/db.js';

/**
 * Temporary Mock Authentication Middleware
 * FOR DEVELOPMENT/TESTING ONLY
 * 
 * This middleware simulates authentication by setting req.user to user ID 1
 * Replace this with proper JWT authentication before production
 * 
 * Security: This MUST be removed and replaced with proper auth middleware
 */

export const mockAuth = async (req, res, next) => {
  try {
    // Simulate authenticated user with ID 1
    const userId = 1;
    
    // Fetch user details from DB to include email (required by invitation routes)
    const [user] = await db`
      SELECT id, email, username FROM users WHERE id = ${userId}
    `;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Mock user not found in database',
      });
    }
    
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
    };
    
    console.warn('Using MOCK AUTH - User ID 1 (Replace with real auth before production)');
    next();
  } catch (error) {
    console.error('Mock auth error:', error);
    next(error);
  }
};

/**
 * TODO: Implement proper JWT authentication
 * 
 * export const verifyToken = async (req, res, next) => {
 *   try {
 *     const token = req.cookies.token;
 *     
 *     if (!token) {
 *       return res.status(401).json({
 *         success: false,
 *         message: 'Authentication required',
 *       });
 *     }
 *     
 *     const decoded = jwt.verify(token, process.env.JWT_SECRET);
 *     req.user = { id: decoded.userId };
 *     next();
 *   } catch (error) {
 *     return res.status(401).json({
 *       success: false,
 *       message: 'Invalid or expired token',
 *     });
 *   }
 * };
 */
