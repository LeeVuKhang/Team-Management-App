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
 * Verify Team Membership Middleware
 * Checks if the authenticated user is a member of the specified team.
 * 
 * SECURITY: Prevents unauthorized access to team resources (IDOR prevention)
 * 
 * Requires: teamId in req.params (or req.validated.params)
 * Sets: req.teamMembership = { role: 'owner'|'admin'|'member' }
 * 
 * @usage router.get('/teams/:teamId', mockAuth, verifyTeamMember, controller)
 */
export const verifyTeamMember = async (req, res, next) => {
  try {
    // Use validated params if available (Zod transforms string to number)
    const { teamId } = req.validated?.params || req.params;
    const userId = req.user?.id;

    // Guard: User must be authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Guard: teamId must be provided
    if (!teamId) {
      return res.status(400).json({
        success: false,
        message: 'Team ID is required',
      });
    }

    // Query team membership with role
    const [membership] = await db`
      SELECT role FROM team_members
      WHERE team_id = ${teamId} AND user_id = ${userId}
    `;

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this team',
      });
    }

    // Attach membership info to request for downstream use
    req.teamMembership = {
      teamId: Number(teamId),
      userId,
      role: membership.role,
    };

    next();
  } catch (error) {
    console.error('[verifyTeamMember] Error:', error);
    next(error);
  }
};

/**
 * Verify Team Role Middleware Factory
 * Creates middleware that checks if user has one of the allowed roles in the team.
 * 
 * SECURITY: Enforces RBAC - Only users with specified roles can proceed
 * 
 * IMPORTANT: Must be used AFTER verifyTeamMember middleware
 * 
 * @param {string[]} allowedRoles - Array of allowed roles (e.g., ['owner', 'admin'])
 * @returns {Function} Express middleware function
 * 
 * @usage router.post('/teams/:teamId/channels', 
 *          mockAuth, 
 *          verifyTeamMember, 
 *          verifyTeamRole(['owner', 'admin']), 
 *          controller)
 */
export const verifyTeamRole = (allowedRoles) => {
  return (req, res, next) => {
    // Guard: verifyTeamMember must run first
    if (!req.teamMembership) {
      return res.status(500).json({
        success: false,
        message: 'Internal error: Team membership not verified',
      });
    }

    const { role } = req.teamMembership;

    // Check if user's role is in the allowed list
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: This action requires one of these roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Convenience middleware: Verify user is Team Owner or Admin
 * Combines verifyTeamMember + verifyTeamRole(['owner', 'admin'])
 * 
 * @usage router.post('/teams/:teamId/channels', mockAuth, verifyTeamAdmin, controller)
 */
export const verifyTeamAdmin = [
  verifyTeamMember,
  verifyTeamRole(['owner', 'admin']),
];

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
