import express from 'express';
// Import individual route files
import projectRoutes, { teamProjectRouter } from './project.routes.js';
import teamRoutes from './team.routes.js';
import invitationRoutes from './invitation.routes.js';
import channelRoutes from './channel.routes.js';
// import authRoutes from './auth.routes.js';

const router = express.Router();

router.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Mount routes
// TODO: Add verifyToken middleware once auth is implemented
// router.use('/auth', authRoutes);
router.use('/teams', teamRoutes); // Auth middleware will be added later
router.use('/teams/:teamId/projects', teamProjectRouter); // Team-level project CRUD
router.use('/teams/:teamId/channels', channelRoutes); // Channel/Message routes (real-time chat)
router.use('/projects', projectRoutes); // Auth middleware will be added later
router.use('/', invitationRoutes); // Invitation routes (user invitations + accept/decline)

export default router;