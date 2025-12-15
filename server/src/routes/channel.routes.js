import express from 'express';
import * as ChannelController from '../controllers/channel.controller.js';
import { validate } from '../middlewares/validate.js';
import { mockAuth } from '../middlewares/auth.js';
import {
  teamIdParamSchema,
  teamChannelParamsSchema,
  createChannelSchema,
  createMessageSchema,
  messagesQuerySchema,
} from '../validations/channel.validation.js';

/**
 * Channel Routes
 * Mounted at /teams/:teamId/channels
 * 
 * Security:
 * - All routes require authentication (mockAuth for dev, replace with verifyToken)
 * - All inputs validated with Zod schemas
 * - Model layer enforces team/project membership (IDOR prevention)
 */

const router = express.Router({ mergeParams: true }); // mergeParams to access :teamId

// Apply auth middleware to all channel routes
// TODO: Replace mockAuth with verifyToken for production
router.use(mockAuth);

/**
 * GET /teams/:teamId/channels
 * List all channels user has access to in the team
 */
router.get(
  '/',
  validate({ params: teamIdParamSchema }),
  ChannelController.getTeamChannels
);

/**
 * POST /teams/:teamId/channels
 * Create a new channel (admin/owner only)
 */
router.post(
  '/',
  validate({
    params: teamIdParamSchema,
    body: createChannelSchema,
  }),
  ChannelController.createChannel
);

/**
 * GET /teams/:teamId/channels/:channelId
 * Get a single channel by ID
 */
router.get(
  '/:channelId',
  validate({ params: teamChannelParamsSchema }),
  ChannelController.getChannel
);

/**
 * GET /teams/:teamId/channels/:channelId/messages
 * Get messages for a channel (with pagination)
 */
router.get(
  '/:channelId/messages',
  validate({
    params: teamChannelParamsSchema,
    query: messagesQuerySchema,
  }),
  ChannelController.getChannelMessages
);

/**
 * POST /teams/:teamId/channels/:channelId/messages
 * Send a message to a channel (REST fallback - prefer WebSocket)
 */
router.post(
  '/:channelId/messages',
  validate({
    params: teamChannelParamsSchema,
    body: createMessageSchema,
  }),
  ChannelController.createMessage
);

export default router;
