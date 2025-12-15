/**
 * Channel API Service
 * REST API calls for channels and messages
 * Note: Real-time messaging uses Socket.io, REST is fallback/initial load
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

/**
 * Fetch all channels for a team
 * @param {number} teamId 
 * @returns {Promise<Array>} Channels with project info
 */
export const fetchTeamChannels = async (teamId) => {
  const url = `${API_BASE}/teams/${teamId}/channels`;
  console.log('[channelApi] Fetching channels from:', url);
  
  const response = await fetch(url, {
    credentials: 'include', // Include cookies for auth
  });

  console.log('[channelApi] Response status:', response.status);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch channels' }));
    console.error('[channelApi] Error response:', error);
    throw new Error(error.message || 'Failed to fetch channels');
  }

  const data = await response.json();
  console.log('[channelApi] Success response:', data);
  console.log('[channelApi] Extracted data.data:', data.data);
  console.log('[channelApi] Type of data.data:', typeof data.data, Array.isArray(data.data));
  return data.data || [];
};

/**
 * Fetch a single channel by ID
 * @param {number} teamId 
 * @param {number} channelId 
 * @returns {Promise<Object>} Channel details
 */
export const fetchChannel = async (teamId, channelId) => {
  const response = await fetch(`${API_BASE}/teams/${teamId}/channels/${channelId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch channel');
  }

  const data = await response.json();
  return data.data;
};

/**
 * Create a new channel
 * @param {number} teamId 
 * @param {Object} channelData - {name, type, projectId, isPrivate}
 * @returns {Promise<Object>} Created channel
 */
export const createChannel = async (teamId, channelData) => {
  const response = await fetch(`${API_BASE}/teams/${teamId}/channels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(channelData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create channel');
  }

  const data = await response.json();
  return data.data;
};

/**
 * Fetch messages for a channel (initial load)
 * @param {number} teamId 
 * @param {number} channelId 
 * @param {Object} options - {limit, before} for pagination
 * @returns {Promise<Array>} Messages with user info
 */
export const fetchChannelMessages = async (teamId, channelId, options = {}) => {
  const params = new URLSearchParams();
  if (options.limit) params.set('limit', options.limit);
  if (options.before) params.set('before', options.before);

  const url = `${API_BASE}/teams/${teamId}/channels/${channelId}/messages${params.toString() ? `?${params}` : ''}`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch messages');
  }

  const data = await response.json();
  return data.data;
};

/**
 * Send a message via REST (fallback if socket disconnected)
 * @param {number} teamId 
 * @param {number} channelId 
 * @param {Object} messageData - {content, attachmentUrl}
 * @returns {Promise<Object>} Created message
 */
export const sendMessageREST = async (teamId, channelId, messageData) => {
  const response = await fetch(`${API_BASE}/teams/${teamId}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(messageData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send message');
  }

  const data = await response.json();
  return data.data;
};
