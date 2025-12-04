import express from 'express';
import * as projectController from '../controllers/project.controller.js';
import { validate } from '../middlewares/validate.js';
import { mockAuth } from '../middlewares/auth.js'; // Temporary mock auth
import {
  projectIdSchema,
  createTaskSchema,
  updateTaskSchema,
  projectTaskParamsSchema,
} from '../validations/project.validation.js';

const router = express.Router();

/**
 * Project Routes
 * Base: /api/v1/projects
 * Security: Using mockAuth for testing (user ID 1) - replace with verifyToken in production
 */

// Apply mock authentication to all project routes
router.use(mockAuth);

/**
 * @route   GET /api/v1/projects/:projectId
 * @desc    Get project details
 * @access  Private (Project Members)
 */
router.get(
  '/:projectId',
  validate({ params: projectIdSchema }),
  projectController.getProject
);

/**
 * @route   GET /api/v1/projects/:projectId/members
 * @desc    Get all project members
 * @access  Private (Project Members)
 */
router.get(
  '/:projectId/members',
  validate({ params: projectIdSchema }),
  projectController.getProjectMembers
);

/**
 * @route   GET /api/v1/projects/:projectId/tasks
 * @desc    Get all tasks in a project
 * @access  Private (Project Members)
 */
router.get(
  '/:projectId/tasks',
  validate({ params: projectIdSchema }),
  projectController.getProjectTasks
);

/**
 * @route   GET /api/v1/projects/:projectId/stats
 * @desc    Get project statistics (task counts)
 * @access  Private (Project Members)
 */
router.get(
  '/:projectId/stats',
  validate({ params: projectIdSchema }),
  projectController.getProjectStats
);

/**
 * @route   POST /api/v1/projects/:projectId/tasks
 * @desc    Create a new task
 * @access  Private (Project Lead/Editor only)
 * @body    {title, description?, status?, priority?, assignee_id?, due_date?}
 */
router.post(
  '/:projectId/tasks',
  validate({ params: projectIdSchema, body: createTaskSchema }),
  projectController.createTask
);

/**
 * @route   PUT /api/v1/projects/:projectId/tasks/:taskId
 * @desc    Update an existing task
 * @access  Private (Project Lead/Editor only)
 * @body    {title?, description?, status?, priority?, assignee_id?, due_date?}
 */
router.put(
  '/:projectId/tasks/:taskId',
  validate({ params: projectTaskParamsSchema, body: updateTaskSchema }),
  projectController.updateTask
);

/**
 * @route   DELETE /api/v1/projects/:projectId/tasks/:taskId
 * @desc    Delete a task
 * @access  Private (Project Lead/Editor only)
 */
router.delete(
  '/:projectId/tasks/:taskId',
  validate({ params: projectTaskParamsSchema }),
  projectController.deleteTask
);

export default router;
