/**
 * Temporary Mock Authentication Middleware
 * FOR DEVELOPMENT/TESTING ONLY
 * 
 * This middleware simulates authentication by setting req.user to user ID 1
 * Replace this with proper JWT authentication before production
 * 
 * Security: This MUST be removed and replaced with proper auth middleware
 */

export const mockAuth = (req, res, next) => {
  // Simulate authenticated user with ID 1
  req.user = {
    id: 1,
  };
  
  console.warn('⚠️  Using MOCK AUTH - User ID 1 (Replace with real auth before production)');
  next();
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
