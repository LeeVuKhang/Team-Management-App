import { z } from 'zod';

/**
 * Team Validation Schemas
 * Using Zod for strict input validation (SECURITY: Prevent injection attacks)
 */

/**
 * Validate teamId parameter in route params
 */
export const teamIdParamSchema = z.object({
  teamId: z
    .string()
    .regex(/^\d+$/, 'Team ID must be a positive integer')
    .transform(Number)
    .refine((val) => val > 0, 'Team ID must be greater than 0'),
});
