import { Server } from 'socket.io';
import * as ChannelModel from '../models/channel.model.js';
import { socketMessageSchema, joinChannelSchema, typingSchema } from '../validations/channel.validation.js';

/**
 * Socket.io Setup for Real-time Chat
 * 
 * Security Considerations:
 * 1. JWT Authentication on connection (using cookie)
 * 2. Channel access verification before joining rooms
 * 3. Zod validation on all incoming events
 * 4. Rate limiting on message sending (TODO: implement)
 */

// In-memory store for active users in channels (for typing indicators, presence)
const channelUsers = new Map(); // channelId -> Set of {socketId, userId, username}

/**
 * Initialize Socket.io with the HTTP server
 * @param {http.Server} httpServer 
 * @returns {Server} Socket.io server instance
 */
export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.CLIENT_URL || 'http://localhost:5173',
        'http://localhost:5174',
      ],
      credentials: true, // Allow cookies for auth
    },
    // Recommended: Use WebSocket transport first, fallback to polling
    transports: ['websocket', 'polling'],
  });

  /**
   * Authentication Middleware
   * SECURITY: Verify user identity before allowing socket connection
   * 
   * TODO: Replace mock auth with JWT verification:
   * - Parse JWT from socket.handshake.auth.token or cookies
   * - Verify token signature with JWT_SECRET
   * - Attach decoded user to socket.user
   */
  io.use(async (socket, next) => {
    try {
      // MOCK AUTH: For development, accept userId from handshake
      // SECURITY WARNING: Replace this with proper JWT auth before production!
      const userId = socket.handshake.auth?.userId;
      
      if (!userId || typeof userId !== 'number') {
        console.warn('⚠️  Socket connection rejected: Missing or invalid userId');
        return next(new Error('Authentication required'));
      }

      // Verify user exists in database
      const user = await ChannelModel.getUserById(userId);
      if (!user) {
        return next(new Error('User not found'));
      }

      // Attach user info to socket for later use
      socket.user = user;
      console.log(`✅ Socket authenticated: User ${user.username} (ID: ${user.id})`);
      next();
    } catch (error) {
      console.error('Socket auth error:', error.message);
      next(new Error('Authentication failed'));
    }
  });

  /**
   * Connection Handler
   */
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.username} (Socket: ${socket.id})`);

    // AUTO-JOIN: User-specific room for direct notifications from n8n
    // This allows the backend/n8n to send notifications directly to a user
    // regardless of which channel they're viewing
    const userRoom = `user:${socket.user.id}`;
    socket.join(userRoom);
    console.log(`📬 ${socket.user.username} joined personal notification room: ${userRoom}`);

    /**
     * JOIN CHANNEL
     * User requests to join a channel room for real-time updates
     * Security: Verify channel access before allowing join
     */
    socket.on('join-channel', async (data, callback) => {
      try {
        // Validate input
        const parsed = joinChannelSchema.safeParse(data);
        if (!parsed.success) {
          return callback?.({ success: false, error: 'Invalid channel ID' });
        }

        const { channelId } = parsed.data;
        const userId = socket.user.id;

        // SECURITY: Verify user has access to this channel
        const channel = await ChannelModel.getChannelById(channelId, userId);
        if (!channel) {
          return callback?.({ success: false, error: 'Channel not found or access denied' });
        }

        // Join the Socket.io room for this channel
        const roomName = `channel:${channelId}`;
        socket.join(roomName);

        // Track user in channel for presence/typing
        if (!channelUsers.has(channelId)) {
          channelUsers.set(channelId, new Set());
        }
        channelUsers.get(channelId).add({
          socketId: socket.id,
          userId: socket.user.id,
          username: socket.user.username,
        });

        // Notify others in channel that user joined
        socket.to(roomName).emit('user-joined', {
          userId: socket.user.id,
          username: socket.user.username,
        });

        console.log(`📺 ${socket.user.username} joined channel:${channelId}`);
        callback?.({ success: true, channel });
      } catch (error) {
        console.error('Join channel error:', error.message);
        callback?.({ success: false, error: 'Failed to join channel' });
      }
    });

    /**
     * LEAVE CHANNEL
     * User leaves a channel room
     */
    socket.on('leave-channel', async (data, callback) => {
      try {
        const parsed = joinChannelSchema.safeParse(data);
        if (!parsed.success) {
          return callback?.({ success: false, error: 'Invalid channel ID' });
        }

        const { channelId } = parsed.data;
        const roomName = `channel:${channelId}`;

        socket.leave(roomName);

        // Remove from presence tracking
        const users = channelUsers.get(channelId);
        if (users) {
          users.forEach(u => {
            if (u.socketId === socket.id) users.delete(u);
          });
        }

        // Notify others
        socket.to(roomName).emit('user-left', {
          userId: socket.user.id,
          username: socket.user.username,
        });

        console.log(`📴 ${socket.user.username} left channel:${channelId}`);
        callback?.({ success: true });
      } catch (error) {
        callback?.({ success: false, error: 'Failed to leave channel' });
      }
    });

    /**
     * SEND MESSAGE
     * User sends a message to a channel
     * Security: Validates input, verifies channel access, saves to DB
     */
    socket.on('send-message', async (data, callback) => {
      try {
        // Validate input with Zod
        const parsed = socketMessageSchema.safeParse(data);
        if (!parsed.success) {
          const errorMsg = parsed.error.errors[0]?.message || 'Invalid message data';
          return callback?.({ success: false, error: errorMsg });
        }

        const { channelId, content } = parsed.data;
        const userId = socket.user.id;

        // Save message to database (model handles access verification)
        const message = await ChannelModel.createMessage(
          { channelId, content },
          userId
        );

        // Broadcast message to all users in the channel (including sender)
        const roomName = `channel:${channelId}`;
        io.to(roomName).emit('new-message', message);

        console.log(`💬 Message in channel:${channelId} from ${socket.user.username}`);
        callback?.({ success: true, message });
      } catch (error) {
        console.error('Send message error:', error.message);
        
        // Return user-friendly error
        if (error.message.includes('Access denied') || error.message.includes('not found')) {
          return callback?.({ success: false, error: 'Channel not found or access denied' });
        }
        callback?.({ success: false, error: 'Failed to send message' });
      }
    });

    /**
     * TYPING INDICATOR
     * Broadcast when user starts/stops typing
     */
    socket.on('typing-start', (data) => {
      const parsed = typingSchema.safeParse(data);
      if (!parsed.success) return;

      const { channelId } = parsed.data;
      const roomName = `channel:${channelId}`;

      socket.to(roomName).emit('user-typing', {
        userId: socket.user.id,
        username: socket.user.username,
      });
    });

    socket.on('typing-stop', (data) => {
      const parsed = typingSchema.safeParse(data);
      if (!parsed.success) return;

      const { channelId } = parsed.data;
      const roomName = `channel:${channelId}`;

      socket.to(roomName).emit('user-stopped-typing', {
        userId: socket.user.id,
      });
    });

    /**
     * DISCONNECT
     * Clean up when user disconnects
     */
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User disconnected: ${socket.user.username} (${reason})`);

      // Remove user from all channel presence tracking
      channelUsers.forEach((users, channelId) => {
        const userInChannel = [...users].find(u => u.socketId === socket.id);
        if (userInChannel) {
          users.delete(userInChannel);
          
          // Notify channel that user left
          socket.to(`channel:${channelId}`).emit('user-left', {
            userId: socket.user.id,
            username: socket.user.username,
          });
        }
      });
    });
  });

  return io;
};

export default initializeSocket;
