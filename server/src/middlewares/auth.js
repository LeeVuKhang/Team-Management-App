import jwt from 'jsonwebtoken';
import db from '../utils/db.js';

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
 * Team Membership Verification Middleware
 * Verifies that authenticated user is a member of the team specified in :teamId param
 * Prevents IDOR attacks by checking team_members table
 * 
 * Prerequisites: Must be called AFTER verifyToken (requires req.user.id)
 * Usage: Apply to all team-scoped routes
 */
export const verifyTeamMember = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;
    
    // Validate teamId is a number (prevent injection)
    if (!teamId || isNaN(parseInt(teamId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid team ID',
      });
    }
    
    // Query team_members table to verify membership
    const membership = await db`
      SELECT role 
      FROM team_members 
      WHERE team_id = ${parseInt(teamId)} AND user_id = ${userId}
    `;
    
    if (membership.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this team',
      });
    }
    
    // Attach team role to request for downstream middleware
    req.teamRole = membership[0].role;
    
    next();
  } catch (error) {
    console.error('verifyTeamMember error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify team membership',
    });
  }
};

/**
 * Team Role Authorization Middleware
 * Verifies that user has one of the required roles in the team
 * 
 * Prerequisites: Must be called AFTER verifyTeamMember (requires req.teamRole)
 * 
 * @param {string[]} allowedRoles - Array of allowed roles (e.g., ['owner', 'admin'])
 * @returns {Function} Express middleware function
 * 
 * Example: verifyTeamRole(['owner', 'admin'])
 */
export const verifyTeamRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.teamRole) {
      return res.status(500).json({
        success: false,
        message: 'Team role not found. Ensure verifyTeamMember is called first.',
      });
    }
    
    if (!allowedRoles.includes(req.teamRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: This action requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
    }
    
    next();
  };
};
