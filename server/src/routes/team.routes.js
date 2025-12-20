import express from 'express';
import * as TeamController from '../controllers/team.controller.js';
import { validate } from '../middlewares/validate.js';
import { 
  teamIdParamSchema, 
  createTeamSchema, 
  updateTeamSchema,
  searchUsersSchema
} from '../validations/team.validation.js';

const router = express.Router();

/**
 * Team Routes
 * Auth: verifyToken middleware applied at router level in index.js
 */

/**
 * @route   GET /api/v1/teams
 * @desc    Get all teams for the authenticated user
 * @access  Private
 */
router.get('/', TeamController.getUserTeams);

/**
 * @route   GET /api/v1/teams/:teamId
 * @desc    Get team details by ID
 * @access  Private (Team Member)
 */
router.get(
  '/:teamId',
  validate(teamIdParamSchema, 'params'),
  TeamController.getTeam
);

/**
 * @route   GET /api/v1/teams/:teamId/members
 * @desc    Get all members of a team
 * @access  Private (Team Member)
 */
router.get(
  '/:teamId/members',
  validate(teamIdParamSchema, 'params'),
  TeamController.getTeamMembers
);

/**
 * @route   GET /api/v1/teams/:teamId/projects
 * @desc    Get all projects in a team
 * @access  Private (Team Member)
 */
router.get(
  '/:teamId/projects',
  validate(teamIdParamSchema, 'params'),
  TeamController.getTeamProjects
);

/**
 * @route   GET /api/v1/teams/:teamId/stats
 * @desc    Get team statistics
 * @access  Private (Team Member)
 */
router.get(
  '/:teamId/stats',
  validate(teamIdParamSchema, 'params'),
  TeamController.getTeamStats
);

/**
 * @route   GET /api/v1/teams/:teamId/search-users
 * @desc    Search users for team invitation (with status indicators)
 * @access  Private (Team Member)
 * @query   q - Search query (username or email)
 */
router.get(
  '/:teamId/search-users',
  validate(teamIdParamSchema, 'params'),
  validate(searchUsersSchema, 'query'),
  TeamController.searchUsers
);

/**
 * @route   POST /api/v1/teams
 * @desc    Create a new team
 * @access  Private (Authenticated user becomes owner)
 */
router.post(
  '/',
  validate(createTeamSchema, 'body'),
  TeamController.createTeam
);

/**
 * @route   PUT /api/v1/teams/:teamId
 * @desc    Update team details
 * @access  Private (Owner or Admin only)
 */
router.put(
  '/:teamId',
  validate(teamIdParamSchema, 'params'),
  validate(updateTeamSchema, 'body'),
  TeamController.updateTeam
);

/**
 * @route   DELETE /api/v1/teams/:teamId
 * @desc    Delete a team (CASCADE deletes all projects, tasks, etc.)
 * @access  Private (Owner only)
 */
router.delete(
  '/:teamId',
  validate(teamIdParamSchema, 'params'),
  TeamController.deleteTeam
);

export default router;
