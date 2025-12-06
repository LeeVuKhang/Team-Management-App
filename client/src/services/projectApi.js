/**
 * Project API Service
 * Handles all API calls related to projects, tasks, and teams
 * 
 * Security Notes:
 * - Uses credentials: 'include' to send HTTP-only cookies with JWT
 * - All endpoints validate user permissions on the backend
 * - Input sanitization happens on backend via Zod schemas
 */

const API_BASE_URL = 'http://localhost:5000/api/v1';

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include', // Send cookies (JWT token)
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

/**
 * Get project details by ID
 * @param {number} projectId 
 * @returns {Promise<{success: boolean, data: object}>}
 */
export async function getProject(projectId) {
  return apiFetch(`/projects/${projectId}`);
}

/**
 * Get all members of a project
 * @param {number} projectId 
 * @returns {Promise<{success: boolean, data: array}>}
 */
export async function getProjectMembers(projectId) {
  return apiFetch(`/projects/${projectId}/members`);
}

/**
 * Get all tasks in a project
 * @param {number} projectId 
 * @returns {Promise<{success: boolean, data: array}>}
 */
export async function getProjectTasks(projectId) {
  return apiFetch(`/projects/${projectId}/tasks`);
}

/**
 * Get project statistics (task counts by status)
 * @param {number} projectId 
 * @returns {Promise<{success: boolean, data: object}>}
 */
export async function getProjectStats(projectId) {
  return apiFetch(`/projects/${projectId}/stats`);
}

/**
 * Create a new task
 * @param {number} projectId 
 * @param {object} taskData - {title, description?, status?, priority?, assignee_id?, due_date?}
 * @returns {Promise<{success: boolean, message: string, data: object}>}
 */
export async function createTask(projectId, taskData) {
  return apiFetch(`/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

/**
 * Update an existing task
 * @param {number} projectId 
 * @param {number} taskId 
 * @param {object} updates - {title?, description?, status?, priority?, assignee_id?, due_date?}
 * @returns {Promise<{success: boolean, message: string, data: object}>}
 */
export async function updateTask(projectId, taskId, updates) {
  return apiFetch(`/projects/${projectId}/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a task
 * @param {number} projectId 
 * @param {number} taskId 
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deleteTask(projectId, taskId) {
  return apiFetch(`/projects/${projectId}/tasks/${taskId}`, {
    method: 'DELETE',
  });
}

// ==================== TEAM API FUNCTIONS ====================

/**
 * Get all teams for the authenticated user
 * @returns {Promise<{success: boolean, data: array}>}
 */
export async function getUserTeams() {
  return apiFetch('/teams');
}

/**
 * Get team details by ID
 * @param {number} teamId 
 * @returns {Promise<{success: boolean, data: object}>}
 */
export async function getTeam(teamId) {
  return apiFetch(`/teams/${teamId}`);
}

/**
 * Get all members of a team
 * @param {number} teamId 
 * @returns {Promise<{success: boolean, data: array}>}
 */
export async function getTeamMembers(teamId) {
  return apiFetch(`/teams/${teamId}/members`);
}

/**
 * Get all projects in a team
 * @param {number} teamId 
 * @returns {Promise<{success: boolean, data: array}>}
 */
export async function getTeamProjects(teamId) {
  return apiFetch(`/teams/${teamId}/projects`);
}

/**
 * Get team statistics (overview metrics)
 * @param {number} teamId 
 * @returns {Promise<{success: boolean, data: object}>}
 */
export async function getTeamStats(teamId) {
  return apiFetch(`/teams/${teamId}/stats`);
}
