import db from '../utils/db.js';

/**
 * Project Model
 * Security: All queries validate user permissions (RBAC)
 * Never expose sensitive data like password_hash
 */

/**
 * Get project by ID with member validation
 * Security: Ensures user has access to this project
 */
export async function getProjectById(projectId, userId) {
    try {
      const [project] = await db`
        SELECT 
          p.id,
          p.team_id,
          p.name,
          p.description,
          p.status,
          p.start_date,
          p.end_date,
          p.created_at,
          pm.role as user_role
        FROM projects p
        INNER JOIN project_members pm ON p.id = pm.project_id
        WHERE p.id = ${projectId}
          AND pm.user_id = ${userId}
      `;

      return project || null;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
}

/**
 * Get all project members
 * Security: Only returns if requester is a project member
 */
export async function getProjectMembers(projectId, userId) {
    try {
      // First verify user has access to this project
      const hasAccess = await db`
        SELECT 1 FROM project_members
        WHERE project_id = ${projectId} AND user_id = ${userId}
      `;

      if (hasAccess.length === 0) {
        throw new Error('Access denied: User not a member of this project');
      }

      const members = await db`
        SELECT 
          pm.id,
          pm.user_id,
          u.username,
          u.avatar_url,
          pm.role,
          pm.added_at
        FROM project_members pm
        INNER JOIN users u ON pm.user_id = u.id
        WHERE pm.project_id = ${projectId}
        ORDER BY 
          CASE pm.role
            WHEN 'lead' THEN 1
            WHEN 'editor' THEN 2
            WHEN 'viewer' THEN 3
          END,
          pm.added_at ASC
      `;

      return members;
    } catch (error) {
      console.error('Error fetching project members:', error);
      throw error;
    }
}

/**
 * Get all tasks for a project
 * Security: Validates user is project member
 */
export async function getProjectTasks(projectId, userId) {
    try {
      // Verify user has access
      const hasAccess = await db`
        SELECT 1 FROM project_members
        WHERE project_id = ${projectId} AND user_id = ${userId}
      `;

      if (hasAccess.length === 0) {
        throw new Error('Access denied: User not a member of this project');
      }

      const tasks = await db`
        SELECT 
          t.id,
          t.project_id,
          t.assignee_id,
          u.username as assignee_name,
          u.avatar_url as assignee_avatar,
          t.title,
          t.description,
          t.status,
          t.priority,
          t.due_date,
          t.created_at,
          t.updated_at,
          COALESCE(
            (SELECT COUNT(*) FROM messages m 
             INNER JOIN channels c ON m.channel_id = c.id 
             WHERE c.project_id = t.project_id), 
            0
          ) as comments_count,
          0 as attachments_count
        FROM tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
        WHERE t.project_id = ${projectId}
        ORDER BY 
          CASE t.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          t.due_date ASC NULLS LAST
      `;

      return tasks;
    } catch (error) {
      console.error('Error fetching project tasks:', error);
      throw error;
    }
}

/**
 * Create a new task
 * Security: Only 'lead' and 'editor' roles can create tasks
 */
export async function createTask(projectId, userId, taskData) {
    try {
      // Verify user has permission (lead or editor)
      const [userRole] = await db`
        SELECT role FROM project_members
        WHERE project_id = ${projectId} AND user_id = ${userId}
      `;

      if (!userRole || (userRole.role !== 'lead' && userRole.role !== 'editor')) {
        throw new Error('Access denied: Only lead or editor can create tasks');
      }

      // Validate assignee is a project member (if assigned)
      if (taskData.assignee_id) {
        const [assigneeExists] = await db`
          SELECT 1 FROM project_members
          WHERE project_id = ${projectId} AND user_id = ${taskData.assignee_id}
        `;

        if (!assigneeExists) {
          throw new Error('Assignee must be a project member');
        }
      }

      const [newTask] = await db`
        INSERT INTO tasks (
          project_id,
          assignee_id,
          title,
          description,
          status,
          priority,
          due_date
        ) VALUES (
          ${projectId},
          ${taskData.assignee_id || null},
          ${taskData.title},
          ${taskData.description || null},
          ${taskData.status || 'todo'},
          ${taskData.priority || 'medium'},
          ${taskData.due_date || null}
        )
        RETURNING *
      `;

      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
}

/**
 * Update a task
 * Security: Only 'lead' and 'editor' roles can update tasks
 */
export async function updateTask(taskId, projectId, userId, updates) {
    try {
      // Verify user has permission
      const [userRole] = await db`
        SELECT role FROM project_members
        WHERE project_id = ${projectId} AND user_id = ${userId}
      `;

      if (!userRole || (userRole.role !== 'lead' && userRole.role !== 'editor')) {
        throw new Error('Access denied: Only lead or editor can update tasks');
      }

      // Verify task belongs to project (prevent IDOR)
      const [taskExists] = await db`
        SELECT 1 FROM tasks
        WHERE id = ${taskId} AND project_id = ${projectId}
      `;

      if (!taskExists) {
        throw new Error('Task not found or does not belong to this project');
      }

      // Build dynamic update query
      const updateFields = [];
      const values = [];
      
      if (updates.title !== undefined) {
        updateFields.push('title');
        values.push(updates.title);
      }
      if (updates.description !== undefined) {
        updateFields.push('description');
        values.push(updates.description);
      }
      if (updates.status !== undefined) {
        updateFields.push('status');
        values.push(updates.status);
      }
      if (updates.priority !== undefined) {
        updateFields.push('priority');
        values.push(updates.priority);
      }
      if (updates.assignee_id !== undefined) {
        updateFields.push('assignee_id');
        values.push(updates.assignee_id);
      }
      if (updates.due_date !== undefined) {
        updateFields.push('due_date');
        values.push(updates.due_date);
      }

      updateFields.push('updated_at');
      values.push(new Date());

      if (updateFields.length === 1) { // Only updated_at
        throw new Error('No fields to update');
      }

      const [updatedTask] = await db`
        UPDATE tasks
        SET ${db(Object.fromEntries(updateFields.map((field, i) => [field, values[i]])))}
        WHERE id = ${taskId}
        RETURNING *
      `;

      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
}

/**
 * Delete a task
 * Security: Only 'lead' and 'editor' roles can delete tasks
 */
export async function deleteTask(taskId, projectId, userId) {
    try {
      // Verify user has permission
      const [userRole] = await db`
        SELECT role FROM project_members
        WHERE project_id = ${projectId} AND user_id = ${userId}
      `;

      if (!userRole || (userRole.role !== 'lead' && userRole.role !== 'editor')) {
        throw new Error('Access denied: Only lead or editor can delete tasks');
      }

      // Verify task belongs to project (prevent IDOR)
      const [taskExists] = await db`
        SELECT 1 FROM tasks
        WHERE id = ${taskId} AND project_id = ${projectId}
      `;

      if (!taskExists) {
        throw new Error('Task not found or does not belong to this project');
      }

      await db`
        DELETE FROM tasks
        WHERE id = ${taskId}
      `;

      return { message: 'Task deleted successfully' };
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
}

/**
 * Get task statistics for a project
 */
export async function getProjectStats(projectId, userId) {
    try {
      // Verify access
      const hasAccess = await db`
        SELECT 1 FROM project_members
        WHERE project_id = ${projectId} AND user_id = ${userId}
      `;

      if (hasAccess.length === 0) {
        throw new Error('Access denied');
      }

      const [stats] = await db`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'todo') as todo,
          COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
          COUNT(*) FILTER (WHERE status = 'review') as review,
          COUNT(*) FILTER (WHERE status = 'done') as done,
          COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'done') as overdue
        FROM tasks
        WHERE project_id = ${projectId}
      `;

      return {
        total: parseInt(stats.total) || 0,
        todo: parseInt(stats.todo) || 0,
        in_progress: parseInt(stats.in_progress) || 0,
        review: parseInt(stats.review) || 0,
        done: parseInt(stats.done) || 0,
        overdue: parseInt(stats.overdue) || 0,
      };
    } catch (error) {
      console.error('Error fetching project stats:', error);
      throw error;
    }
}
