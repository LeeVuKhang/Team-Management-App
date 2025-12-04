import { z } from 'zod';

/**
 * Zod Validation Schemas for Project Routes
 * Security: Validates and sanitizes all inputs to prevent injection attacks
 */

// Task status enum from schema.sql
const taskStatusEnum = z.enum(['todo', 'in_progress', 'review', 'done']);

// Task priority enum from schema.sql
const taskPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);

/**
 * Schema for creating a new task
 */
export const createTaskSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title must be at most 255 characters')
    .trim(),
  
  description: z.string()
    .max(5000, 'Description must be at most 5000 characters')
    .optional()
    .nullable(),
  
  status: taskStatusEnum.default('todo'),
  
  priority: taskPriorityEnum.default('medium'),
  
  assignee_id: z.number()
    .int('Assignee ID must be an integer')
    .positive('Assignee ID must be positive')
    .optional()
    .nullable(),
  
  due_date: z.string()
    .datetime('Invalid datetime format')
    .optional()
    .nullable()
    .or(z.null()),
});

/**
 * Schema for updating a task
 * All fields are optional but at least one must be provided
 */
export const updateTaskSchema = z.object({
  title: z.string()
    .min(1, 'Title cannot be empty')
    .max(255, 'Title must be at most 255 characters')
    .trim()
    .optional(),
  
  description: z.string()
    .max(5000, 'Description must be at most 5000 characters')
    .optional()
    .nullable(),
  
  status: taskStatusEnum.optional(),
  
  priority: taskPriorityEnum.optional(),
  
  assignee_id: z.number()
    .int('Assignee ID must be an integer')
    .positive('Assignee ID must be positive')
    .optional()
    .nullable(),
  
  due_date: z.string()
    .datetime('Invalid datetime format')
    .optional()
    .nullable(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

/**
 * Schema for project ID parameter
 */
export const projectIdSchema = z.object({
  projectId: z.string()
    .regex(/^\d+$/, 'Project ID must be a number')
    .transform(Number)
    .refine(val => val > 0, 'Project ID must be positive'),
});

/**
 * Schema for task ID parameter
 */
export const taskIdSchema = z.object({
  taskId: z.string()
    .regex(/^\d+$/, 'Task ID must be a number')
    .transform(Number)
    .refine(val => val > 0, 'Task ID must be positive'),
});

/**
 * Combined schema for routes with both projectId and taskId
 */
export const projectTaskParamsSchema = z.object({
  projectId: z.string()
    .regex(/^\d+$/, 'Project ID must be a number')
    .transform(Number)
    .refine(val => val > 0, 'Project ID must be positive'),
  
  taskId: z.string()
    .regex(/^\d+$/, 'Task ID must be a number')
    .transform(Number)
    .refine(val => val > 0, 'Task ID must be positive'),
});
