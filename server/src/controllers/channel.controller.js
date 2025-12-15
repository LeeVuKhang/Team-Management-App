import * as ChannelModel from '../models/channel.model.js';

/**
 * Channel Controller
 * Handles HTTP requests for channel and message operations
 * Security: Relies on model-level RBAC checks for authorization
 * 
 * Note: Use req.validated.params and req.validated.query for Zod-transformed values
 * (e.g., string IDs converted to numbers)
 */

/**
 * GET /teams/:teamId/channels
 * Get all channels for a team that user has access to
 */
export const getTeamChannels = async (req, res, next) => {
  try {
    // Use validated params for transformed (numeric) teamId
    const { teamId } = req.validated?.params || req.params;
    const userId = req.user.id;

    console.log(`[getTeamChannels] User ${userId} requesting channels for team ${teamId}`);

    const channels = await ChannelModel.getTeamChannels(teamId, userId);

    console.log(`[getTeamChannels] Found ${channels.length} channels`);

    res.status(200).json({
      success: true,
      data: channels,
    });
  } catch (error) {
    console.error('[getTeamChannels] Error:', error.message);
    // Handle known authorization errors
    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * GET /teams/:teamId/channels/:channelId
 * Get a single channel by ID
 */
export const getChannel = async (req, res, next) => {
  try {
    const { channelId } = req.validated?.params || req.params;
    const userId = req.user.id;

    const channel = await ChannelModel.getChannelById(channelId, userId);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    res.status(200).json({
      success: true,
      data: channel,
    });
  } catch (error) {
    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * POST /teams/:teamId/channels
 * Create a new channel in a team
 */
export const createChannel = async (req, res, next) => {
  try {
    const { teamId } = req.validated?.params || req.params;
    const userId = req.user.id;
    const { name, type, projectId, isPrivate } = req.body;

    const channel = await ChannelModel.createChannel(
      { teamId, name, type, projectId, isPrivate },
      userId
    );

    res.status(201).json({
      success: true,
      message: 'Channel created successfully',
      data: channel,
    });
  } catch (error) {
    // Handle duplicate channel name (unique constraint)
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A channel with this name already exists in the team',
      });
    }
    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message.includes('Project not found')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * GET /teams/:teamId/channels/:channelId/messages
 * Get messages for a channel with pagination
 */
export const getChannelMessages = async (req, res, next) => {
  try {
    const { channelId } = req.validated?.params || req.params;
    const userId = req.user.id;
    // Use validated query for transformed (numeric) values
    const { limit, before } = req.validated?.query || req.query;

    const messages = await ChannelModel.getChannelMessages(channelId, userId, {
      limit: limit || 50,
      before,
    });

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    if (error.message.includes('Access denied') || error.message.includes('not found')) {
      return res.status(403).json({
        success: false,
        message: 'Channel not found or access denied',
      });
    }
    next(error);
  }
};

/**
 * POST /teams/:teamId/channels/:channelId/messages
 * Create a new message in a channel (REST fallback, prefer WebSocket)
 */
export const createMessage = async (req, res, next) => {
  try {
    const { channelId } = req.validated?.params || req.params;
    const userId = req.user.id;
    const { content, attachmentUrl } = req.body;

    const message = await ChannelModel.createMessage(
      { channelId, content, attachmentUrl },
      userId
    );

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    if (error.message.includes('Access denied') || error.message.includes('not found')) {
      return res.status(403).json({
        success: false,
        message: 'Channel not found or access denied',
      });
    }
    next(error);
  }
};
