import express from 'express';
// Import individual route files
import authRoutes from './auth.routes.js';
import projectRoutes, { teamProjectRouter } from './project.routes.js';
import teamRoutes from './team.routes.js';
import invitationRoutes from './invitation.routes.js';
import channelRoutes from './channel.routes.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Mount routes
router.use('/auth', authRoutes); // Authentication endpoints
router.use('/teams', verifyToken, teamRoutes); // Protected routes
router.use('/teams/:teamId/projects', verifyToken, teamProjectRouter); // Protected routes
router.use('/teams/:teamId/channels', channelRoutes); // Channel/Message routes (real-time chat)
router.use('/projects', verifyToken, projectRoutes); // Protected routes
router.use('/', verifyToken, invitationRoutes); // Protected routes (user invitations + accept/decline)

export default router;