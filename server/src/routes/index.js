import express from 'express';
// Import individual route files
import projectRoutes from './project.routes.js';
import teamRoutes from './team.routes.js';
// import authRoutes from './auth.routes.js';

const router = express.Router();

router.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Mount routes
// TODO: Add verifyToken middleware once auth is implemented
// router.use('/auth', authRoutes);
router.use('/teams', teamRoutes); // Auth middleware will be added later
router.use('/projects', projectRoutes); // Auth middleware will be added later

export default router;