import db from '../utils/db.js';

/**
 * Team Model
 * Handles database operations for teams with RBAC enforcement
 * Security: All queries verify team membership before returning data (IDOR prevention)
 */

/**
 * Get team details by ID with membership verification
 * @param {number} teamId - Team ID to fetch
 * @param {number} userId - User ID making the request (for RBAC)
 * @returns {Promise<Object>} Team details with owner info
 * @throws {Error} If user is not a team member
 */
export const getTeamById = async (teamId, userId) => {
  // SECURITY: First verify that the user is a member of this team (IDOR prevention)
  const membershipCheck = await db`
    SELECT role FROM team_members WHERE team_id = ${teamId} AND user_id = ${userId}
  `;

  if (membershipCheck.length === 0) {
    throw new Error('Access denied: User is not a member of this team');
  }

  // User is authorized, fetch team details
  const [team] = await db`
    SELECT 
      t.id,
      t.name,
      t.description,
      t.owner_id,
      t.created_at,
      t.updated_at,
      u.username AS owner_username,
      u.avatar_url AS owner_avatar
    FROM teams t
    LEFT JOIN users u ON t.owner_id = u.id
    WHERE t.id = ${teamId}
  `;

  return team || null;
};

/**
 * Get all members of a team
 * @param {number} teamId - Team ID
 * @param {number} userId - User ID making the request (for RBAC)
 * @returns {Promise<Array>} List of team members with user details
 * @throws {Error} If user is not a team member
 */
export const getTeamMembers = async (teamId, userId) => {
  // SECURITY: Verify team membership
  const membershipCheck = await db`
    SELECT 1 FROM team_members WHERE team_id = ${teamId} AND user_id = ${userId}
  `;

  if (membershipCheck.length === 0) {
    throw new Error('Access denied: User is not a member of this team');
  }

  // Fetch all team members with user details
  const members = await db`
    SELECT 
      tm.id,
      tm.role,
      tm.joined_at,
      u.id AS user_id,
      u.username,
      u.email,
      u.avatar_url
    FROM team_members tm
    INNER JOIN users u ON tm.user_id = u.id
    WHERE tm.team_id = ${teamId}
    ORDER BY 
      CASE tm.role 
        WHEN 'owner' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'member' THEN 3
      END,
      tm.joined_at ASC
  `;

  return members;
};

/**
 * Get all projects in a team
 * @param {number} teamId - Team ID
 * @param {number} userId - User ID making the request (for RBAC)
 * @returns {Promise<Array>} List of projects with task counts
 * @throws {Error} If user is not a team member
 */
export const getTeamProjects = async (teamId, userId) => {
  // SECURITY: Verify team membership
  const membershipCheck = await db`
    SELECT 1 FROM team_members WHERE team_id = ${teamId} AND user_id = ${userId}
  `;

  if (membershipCheck.length === 0) {
    throw new Error('Access denied: User is not a member of this team');
  }

  // Fetch all projects in the team with task statistics
  const projects = await db`
    SELECT 
      p.id,
      p.name,
      p.description,
      p.status,
      p.start_date,
      p.end_date,
      p.created_at,
      COUNT(DISTINCT pm.user_id) AS member_count,
      COUNT(DISTINCT t.id) AS total_tasks,
      COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) AS completed_tasks
    FROM projects p
    LEFT JOIN project_members pm ON p.id = pm.project_id
    LEFT JOIN tasks t ON p.id = t.project_id
    WHERE p.team_id = ${teamId}
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;

  return projects;
};

/**
 * Get team statistics (overview metrics)
 * @param {number} teamId - Team ID
 * @param {number} userId - User ID making the request (for RBAC)
 * @returns {Promise<Object>} Team statistics
 * @throws {Error} If user is not a team member
 */
export const getTeamStats = async (teamId, userId) => {
  // SECURITY: Verify team membership
  const membershipCheck = await db`
    SELECT 1 FROM team_members WHERE team_id = ${teamId} AND user_id = ${userId}
  `;

  if (membershipCheck.length === 0) {
    throw new Error('Access denied: User is not a member of this team');
  }

  // Fetch aggregated statistics across all team projects
  const [stats] = await db`
    SELECT 
      COUNT(DISTINCT p.id) AS total_projects,
      COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'active') AS active_projects,
      COUNT(DISTINCT tm.user_id) AS total_members,
      COUNT(DISTINCT t.id) AS total_tasks,
      COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done') AS completed_tasks,
      COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'in_progress') AS in_progress_tasks
    FROM teams team
    LEFT JOIN projects p ON team.id = p.team_id
    LEFT JOIN team_members tm ON team.id = tm.team_id
    LEFT JOIN tasks t ON p.id = t.project_id
    WHERE team.id = ${teamId}
    GROUP BY team.id
  `;

  return stats || {
    total_projects: 0,
    active_projects: 0,
    total_members: 0,
    total_tasks: 0,
    completed_tasks: 0,
    in_progress_tasks: 0,
  };
};

/**
 * Get all teams for a user (for sidebar navigation)
 * @param {number} userId - User ID
 * @returns {Promise<Array>} List of teams the user is a member of
 */
export const getUserTeams = async (userId) => {
  const teams = await db`
    SELECT 
      t.id,
      t.name,
      t.description,
      tm.role,
      COUNT(DISTINCT p.id) AS project_count
    FROM teams t
    INNER JOIN team_members tm ON t.id = tm.team_id
    LEFT JOIN projects p ON t.id = p.team_id
    WHERE tm.user_id = ${userId}
    GROUP BY t.id, t.name, t.description, tm.role
    ORDER BY t.created_at DESC
  `;

  return teams;
};
