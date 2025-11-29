import express from 'express';
// Import individual route files (placeholders)
// import authRoutes from './auth.routes.js';
// import teamRoutes from './teams.routes.js';

const router = express.Router();

router.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Mount routes
// router.use('/auth', authRoutes);
// router.use('/teams', teamRoutes); 
// router.use('/projects', projectsRoutes);

export default router;