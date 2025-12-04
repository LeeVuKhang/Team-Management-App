import * as ProjectModel from '../models/project.model.js';

/**
 * Project Controller
 * Handles business logic and HTTP responses for project-related operations
 * Security: Relies on model's built-in RBAC and IDOR prevention
 */

/**
 * Get project details by ID
 * @route GET /api/v1/projects/:projectId
 */
export const getProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id; // From auth middleware (to be implemented)

    const project = await ProjectModel.getProjectById(projectId, userId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or you do not have access',
      });
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    // Security: Do not expose internal errors to client
    if (error.message.includes('not a member')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this project',
      });
    }
    next(error); // Pass to centralized error handler
  }
};

/**
 * Get all members of a project
 * @route GET /api/v1/projects/:projectId/members
 */
export const getProjectMembers = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const members = await ProjectModel.getProjectMembers(projectId, userId);

    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    if (error.message.includes('not a member')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this project',
      });
    }
    next(error);
  }
};

/**
 * Get all tasks for a project
 * @route GET /api/v1/projects/:projectId/tasks
 */
export const getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const tasks = await ProjectModel.getProjectTasks(projectId, userId);

    res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    if (error.message.includes('not a member')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this project',
      });
    }
    next(error);
  }
};

/**
 * Get project statistics (task counts by status)
 * @route GET /api/v1/projects/:projectId/stats
 */
export const getProjectStats = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const stats = await ProjectModel.getProjectStats(projectId, userId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    if (error.message.includes('not a member')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this project',
      });
    }
    next(error);
  }
};

/**
 * Create a new task in a project
 * @route POST /api/v1/projects/:projectId/tasks
 * @body {title, description?, status?, priority?, assignee_id?, due_date?}
 */
export const createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const taskData = req.body; // Already validated by Zod middleware

    const newTask = await ProjectModel.createTask(projectId, userId, taskData);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: newTask,
    });
  } catch (error) {
    // Handle specific business logic errors with appropriate HTTP codes
    if (error.message.includes('not a member')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this project',
      });
    }
    
    if (error.message.includes('Only lead or editor')) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only project leads and editors can create tasks',
      });
    }

    if (error.message.includes('Assignee must be a project member')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignee: User must be a project member',
      });
    }

    next(error);
  }
};

/**
 * Update an existing task
 * @route PUT /api/v1/projects/:projectId/tasks/:taskId
 * @body {title?, description?, status?, priority?, assignee_id?, due_date?}
 */
export const updateTask = async (req, res, next) => {
  try {
    const { projectId, taskId } = req.params;
    const userId = req.user.id;
    const updates = req.body; // Already validated by Zod middleware

    const updatedTask = await ProjectModel.updateTask(taskId, projectId, userId, updates);

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or does not belong to this project',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask,
    });
  } catch (error) {
    if (error.message.includes('not a member')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this project',
      });
    }

    if (error.message.includes('Only lead or editor')) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only project leads and editors can update tasks',
      });
    }

    if (error.message.includes('does not belong to this project')) {
      return res.status(403).json({
        success: false,
        message: 'IDOR Attack Prevented: Task does not belong to this project',
      });
    }

    if (error.message.includes('Assignee must be a project member')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignee: User must be a project member',
      });
    }

    next(error);
  }
};

/**
 * Delete a task
 * @route DELETE /api/v1/projects/:projectId/tasks/:taskId
 */
export const deleteTask = async (req, res, next) => {
  try {
    const { projectId, taskId } = req.params;
    const userId = req.user.id;

    const success = await ProjectModel.deleteTask(taskId, projectId, userId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or does not belong to this project',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    if (error.message.includes('not a member')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this project',
      });
    }

    if (error.message.includes('Only lead and editor')) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only project leads and editors can delete tasks',
      });
    }

    if (error.message.includes('does not belong to this project')) {
      return res.status(403).json({
        success: false,
        message: 'IDOR Attack Prevented: Task does not belong to this project',
      });
    }

    next(error);
  }
};
