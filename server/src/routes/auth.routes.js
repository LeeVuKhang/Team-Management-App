import express from 'express';
import * as AuthController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { verifyToken } from '../middlewares/auth.js';
import { registerSchema, loginSchema } from '../validations/auth.validation.js';

const router = express.Router();

/**
 * Auth Routes
 * Handles user authentication endpoints
 */

/**
 * @route POST /api/v1/auth/register
 * @desc Register a new user account
 * @access Public
 */
router.post('/register', validate(registerSchema), AuthController.register);

/**
 * @route POST /api/v1/auth/login
 * @desc Login existing user
 * @access Public
 */
router.post('/login', validate(loginSchema), AuthController.login);

/**
 * @route POST /api/v1/auth/logout
 * @desc Logout current user (clear cookie)
 * @access Public
 */
router.post('/logout', AuthController.logout);

/**
 * @route GET /api/v1/auth/me
 * @desc Get current authenticated user information
 * @access Private (requires authentication)
 */
router.get('/me', verifyToken, AuthController.getMe);

export default router;
