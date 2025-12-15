import { io } from 'socket.io-client';

/**
 * Socket Service
 * Manages Socket.io connection for real-time chat
 * 
 * Security: Uses authentication handshake with userId
 * TODO: Replace userId auth with JWT token from cookies
 */

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

/**
 * Initialize socket connection with authentication
 * @param {number} userId - Current user's ID for authentication
 * @returns {Socket} Socket.io client instance
 */
export const initSocket = (userId) => {
  if (socket?.connected) {
    console.log('Socket already connected');
    return socket;
  }

  socket = io(SOCKET_URL, {
    withCredentials: true, // Send cookies for auth
    auth: {
      userId, // TODO: Replace with JWT token
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  return socket;
};

/**
 * Get the current socket instance
 * @returns {Socket|null}
 */
export const getSocket = () => socket;

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join a channel room for real-time updates
 * @param {number} channelId 
 * @returns {Promise<Object>} Channel info on success
 */
export const joinChannel = (channelId) => {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      return reject(new Error('Socket not connected'));
    }

    socket.emit('join-channel', { channelId }, (response) => {
      if (response.success) {
        resolve(response.channel);
      } else {
        reject(new Error(response.error || 'Failed to join channel'));
      }
    });
  });
};

/**
 * Leave a channel room
 * @param {number} channelId 
 * @returns {Promise<void>}
 */
export const leaveChannel = (channelId) => {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      return resolve(); // Already disconnected
    }

    socket.emit('leave-channel', { channelId }, (response) => {
      if (response?.success) {
        resolve();
      } else {
        reject(new Error(response?.error || 'Failed to leave channel'));
      }
    });
  });
};

/**
 * Send a message via socket
 * @param {number} channelId 
 * @param {string} content 
 * @returns {Promise<Object>} Created message
 */
export const sendMessage = (channelId, content) => {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      return reject(new Error('Socket not connected'));
    }

    socket.emit('send-message', { channelId, content }, (response) => {
      if (response.success) {
        resolve(response.message);
      } else {
        reject(new Error(response.error || 'Failed to send message'));
      }
    });
  });
};

/**
 * Emit typing start indicator
 * @param {number} channelId 
 */
export const emitTypingStart = (channelId) => {
  if (socket?.connected) {
    socket.emit('typing-start', { channelId });
  }
};

/**
 * Emit typing stop indicator
 * @param {number} channelId 
 */
export const emitTypingStop = (channelId) => {
  if (socket?.connected) {
    socket.emit('typing-stop', { channelId });
  }
};

/**
 * Subscribe to new messages in current channel
 * @param {Function} callback - Called with new message data
 * @returns {Function} Unsubscribe function
 */
export const onNewMessage = (callback) => {
  if (!socket) return () => {};
  
  socket.on('new-message', callback);
  return () => socket?.off('new-message', callback);
};

/**
 * Subscribe to user typing events
 * @param {Function} callback - Called with {userId, username}
 * @returns {Function} Unsubscribe function
 */
export const onUserTyping = (callback) => {
  if (!socket) return () => {};
  
  socket.on('user-typing', callback);
  return () => socket?.off('user-typing', callback);
};

/**
 * Subscribe to user stopped typing events
 * @param {Function} callback - Called with {userId}
 * @returns {Function} Unsubscribe function
 */
export const onUserStoppedTyping = (callback) => {
  if (!socket) return () => {};
  
  socket.on('user-stopped-typing', callback);
  return () => socket?.off('user-stopped-typing', callback);
};

/**
 * Subscribe to user joined events
 * @param {Function} callback - Called with {userId, username}
 * @returns {Function} Unsubscribe function
 */
export const onUserJoined = (callback) => {
  if (!socket) return () => {};
  
  socket.on('user-joined', callback);
  return () => socket?.off('user-joined', callback);
};

/**
 * Subscribe to user left events
 * @param {Function} callback - Called with {userId, username}
 * @returns {Function} Unsubscribe function
 */
export const onUserLeft = (callback) => {
  if (!socket) return () => {};
  
  socket.on('user-left', callback);
  return () => socket?.off('user-left', callback);
};

export default {
  initSocket,
  getSocket,
  disconnectSocket,
  joinChannel,
  leaveChannel,
  sendMessage,
  emitTypingStart,
  emitTypingStop,
  onNewMessage,
  onUserTyping,
  onUserStoppedTyping,
  onUserJoined,
  onUserLeft,
};
