import * as TeamModel from '../models/team.model.js';

/**
 * Team Controller
 * Handles business logic and HTTP responses for team-related operations
 * Security: Relies on model's built-in RBAC and IDOR prevention
 */

/**
 * Get team details by ID
 * @route GET /api/v1/teams/:teamId
 */
export const getTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id; // From auth middleware

    const team = await TeamModel.getTeamById(teamId, userId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found or you do not have access',
      });
    }

    res.status(200).json({
      success: true,
      data: team,
    });
  } catch (error) {
    // Security: Do not expose internal errors to client
    if (error.message.includes('not a member')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this team',
      });
    }
    next(error); // Pass to centralized error handler
  }
};

/**
 * Get all members of a team
 * @route GET /api/v1/teams/:teamId/members
 */
export const getTeamMembers = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    const members = await TeamModel.getTeamMembers(teamId, userId);

    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    if (error.message.includes('not a member')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this team',
      });
    }
    next(error);
  }
};

/**
 * Get all projects in a team
 * @route GET /api/v1/teams/:teamId/projects
 */
export const getTeamProjects = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    const projects = await TeamModel.getTeamProjects(teamId, userId);

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    if (error.message.includes('not a member')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this team',
      });
    }
    next(error);
  }
};

/**
 * Get team statistics (overview metrics)
 * @route GET /api/v1/teams/:teamId/stats
 */
export const getTeamStats = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    const stats = await TeamModel.getTeamStats(teamId, userId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    if (error.message.includes('not a member')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this team',
      });
    }
    next(error);
  }
};

/**
 * Get all teams for the authenticated user
 * @route GET /api/v1/teams
 */
export const getUserTeams = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const teams = await TeamModel.getUserTeams(userId);

    res.status(200).json({
      success: true,
      data: teams,
    });
  } catch (error) {
    next(error);
  }
};
