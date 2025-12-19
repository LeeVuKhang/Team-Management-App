import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Hash,
  Volume2,
  Search,
  Plus,
  Send,
  Paperclip,
  MoreVertical,
  Smile,
  Menu,
  Info,
  WifiOff,
  X,
  ChevronDown,
  Bell,
  BellOff,
  FileText,
  Link as LinkIcon,
  Download,
  ExternalLink,
  Users
} from 'lucide-react';
import { fetchTeamChannels, fetchChannelMessages, createChannel, searchMessages } from './services/channelApi.js';
import { getTeamProjects, getTeam } from './services/projectApi.js';
import { useDebounce } from './hooks/useDebounce.js';
import { useAuth } from './hooks/useAuth.js';
import {
  initSocket,
  disconnectSocket,
  joinChannel,
  leaveChannel,
  sendMessage as socketSendMessage,
  onNewMessage,
  onUserTyping,
  onUserStoppedTyping,
  emitTypingStart,
  emitTypingStop,
  getSocket,
} from './services/socketService.js';
const MAX_MESSAGE_LENGTH = 2000; // Character limit for messages (matches DB constraint)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_FILES = 5; // Maximum files per message
const ALLOWED_FILE_TYPES = [
  // Images
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Documents
  'application/pdf', 'text/plain', 'text/markdown',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Archives
  'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
  // Code
  'text/javascript', 'text/html', 'text/css', 'application/json', 'text/xml',
  'text/x-python', 'text/x-java', 'text/x-c', 'text/x-cpp',
  // Video
  'video/mp4', 'video/webm', 'video/quicktime',
  // Audio
  'audio/mpeg', 'audio/wav', 'audio/ogg'
];

/**
 * SUB-COMPONENT: Create Channel Modal
 * Extracted outside main component to prevent re-creation on every render
 */
const CreateChannelModal = ({ 
  isModalOpen, 
  modalContext, 
  availableProjects,
  newChannelName,
  setNewChannelName,
  selectedProjectId,
  setSelectedProjectId,
  isCreatingChannel,
  closeCreateChannelModal,
  handleCreateChannel,
  isDarkMode 
}) => {
  if (!isModalOpen) return null;

  const isProjectLocked = modalContext?.type === 'project';
  
  const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const hoverBg = isDarkMode ? 'hover:bg-[#171717]' : 'hover:bg-gray-100';
  const inputBg = isDarkMode ? 'bg-[#171717] text-white border-[#333]' : 'bg-white text-black border-gray-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-xl shadow-2xl ${isDarkMode ? 'bg-dark-secondary' : 'bg-white'}`}>
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'border-[#171717]' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold ${textPrimary}`}>
            Create Channel
          </h2>
          <button
            onClick={closeCreateChannelModal}
            className={`p-1 rounded-lg ${hoverBg} ${textSecondary}`}
            disabled={isCreatingChannel}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleCreateChannel} className="p-6 space-y-5">
          
          {/* Belongs To Selector */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${textPrimary}`}>
              Belongs to {isProjectLocked && <span className={`text-xs font-normal ${textSecondary}`}>(locked)</span>}
            </label>
            
            {isProjectLocked ? (
              <div className={`w-full px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-[#171717] border-[#333] text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-600'} cursor-not-allowed`}>
                {modalContext.projectName ? `Project: ${modalContext.projectName}` : 'Entire Team'}
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border appearance-none cursor-pointer ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#006239]/50 ${textPrimary}`}
                  disabled={isCreatingChannel}
                  required
                >
                  <option value="">-- Select --</option>
                  <option value="null">Entire Team</option>
                  {availableProjects.map(project => (
                    <option key={project.id} value={project.id}>
                      Project: {project.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${textSecondary}`} />
              </div>
            )}
          </div>

          {/* Channel Name Input */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${textPrimary}`}>
              Channel Name
            </label>
            <div className="relative">
              <Hash size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} />
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="e.g., dev-team"
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#006239]/50 ${textPrimary}`}
                maxLength={50}
                disabled={isCreatingChannel}
                required
              />
            </div>
            <p className={`text-xs mt-1 ${textSecondary}`}>
              Use lowercase letters, numbers, and hyphens
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeCreateChannelModal}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium border transition-colors ${isDarkMode ? 'border-[#333] text-gray-300 hover:bg-[#171717]' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              disabled={isCreatingChannel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-colors ${isCreatingChannel ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#006239] hover:bg-[#005230]'}`}
              disabled={isCreatingChannel}
            >
              {isCreatingChannel ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function ChatPage() {
  const { isDarkMode } = useOutletContext();
  const { teamId } = useParams();
  const navigate = useNavigate();
  
  // Get current authenticated user
  const { user: currentUser, isLoading: isLoadingUser, isError: isAuthError } = useAuth();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (isAuthError) {
      toast.error('Please log in to access chat');
      navigate('/login');
    }
  }, [isAuthError, navigate]);
  
  // State
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [channelError, setChannelError] = useState(null);
  const [messageError, setMessageError] = useState(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState(null); // { type: 'global' } or { type: 'project', projectId, projectName }
  const [newChannelName, setNewChannelName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  
  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // Info sidebar state
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // File attachment state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Mock data for files and links (TODO: Replace with API calls)
  const [channelFiles] = useState([
    { id: 1, name: 'demo TeamApp.mp4', size: '19.3 MB', date: '12/12/2025', type: 'video' },
    { id: 2, name: 'copilot-instructions.md', size: '3.64 KB', date: '05/12/2025', type: 'document' },
    { id: 3, name: 'seed.sql', size: '5.57 KB', date: '04/12/2025', type: 'code' },
  ]);
  const [channelLinks] = useState([]);
  
  // Team projects state (for dropdown in create channel modal)
  const [teamProjects, setTeamProjects] = useState([]);
  
  // Team data state
  const [teamData, setTeamData] = useState(null);
  
  // Pagination state
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const previousChannelRef = useRef(null);
  const prevScrollHeightRef = useRef(null); // For maintaining scroll position during pagination
  const isPaginatingRef = useRef(false); // Track if we're loading older messages
  const isInitialLoadRef = useRef(true); // Track if this is the first message load

  /**
   * Initialize Socket connection on mount
   */
  useEffect(() => {
    console.log('[ChatPage] Initializing Socket connection...');
    const socket = initSocket();
    
    socket.on('connect', () => {
      console.log('[ChatPage] Socket connected successfully!');
      setIsConnected(true);
    });
    
    socket.on('disconnect', () => {
      console.log('[ChatPage] Socket disconnected');
      setIsConnected(false);
    });
    
    socket.on('connect_error', (error) => {
      console.error('[ChatPage] Socket connection error:', error.message);
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  /**
   * Fetch channels and projects when teamId changes
   */
  useEffect(() => {
    if (!teamId) {
      // No team selected - stop loading and show empty state
      setIsLoadingChannels(false);
      setChannels([]);
      setTeamProjects([]);
      return;
    }

    const loadData = async () => {
      console.log('[ChatPage] Fetching channels for team:', teamId);
      setIsLoadingChannels(true);
      setChannelError(null);
      try {
        // Fetch team data, channels and projects in parallel
        const [teamDataResponse, channelsData, projectsData] = await Promise.all([
          getTeam(teamId).catch(err => {
            console.warn('[ChatPage] Failed to fetch team:', err);
            return { data: null }; // Fallback to null if team fails
          }),
          fetchTeamChannels(teamId),
          getTeamProjects(teamId).catch(err => {
            console.warn('[ChatPage] Failed to fetch projects:', err);
            return { data: [] }; // Fallback to empty array if projects fail
          })
        ]);
        
        console.log('[ChatPage] Received team:', teamDataResponse?.data);
        console.log('[ChatPage] Received channels:', channelsData);
        console.log('[ChatPage] Received projects:', projectsData);
        
        setTeamData(teamDataResponse?.data);
        setChannels(channelsData);
        setTeamProjects(projectsData.data || []);
        
        // Auto-select first channel if none selected
        if (channelsData.length > 0 && !activeChannel) {
          console.log('[ChatPage] Auto-selecting first channel:', channelsData[0]);
          setActiveChannel(channelsData[0]);
        }
      } catch (err) {
        console.error('[ChatPage] Failed to fetch channels:', err);
        setChannelError(err.message || 'Failed to load channels');
      } finally {
        setIsLoadingChannels(false);
      }
    };

    loadData();
  }, [teamId]);

  /**
   * Handle channel switch: leave old room, join new room, fetch messages
   */
  useEffect(() => {
    if (!activeChannel || !isConnected) return;

    const switchChannel = async () => {
      setIsLoading(true);
      setMessages([]);
      setTypingUsers([]);
      setMessageError(null);
      setHasMoreMessages(true);
      isInitialLoadRef.current = true; // Mark as initial load for new channel

      // Leave previous channel room
      if (previousChannelRef.current && previousChannelRef.current !== activeChannel.id) {
        await leaveChannel(previousChannelRef.current).catch(console.error);
      }

      try {
        // Join new channel room for real-time updates
        await joinChannel(activeChannel.id);
        
        // Fetch initial message history (last 20 messages for better scrolling)
        const data = await fetchChannelMessages(teamId, activeChannel.id, { limit: 20 });
        setMessages(data || []);
        
        // If we got less than 20 messages, there are no more to load
        setHasMoreMessages(data && data.length === 20);
        
        previousChannelRef.current = activeChannel.id;
      } catch (err) {
        console.error('Failed to load channel:', err);
        setMessageError('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    switchChannel();
  }, [activeChannel?.id, isConnected, teamId]);

  /**
   * Load more messages (pagination)
   */
  const loadMoreMessages = useCallback(async () => {
    if (!activeChannel || !hasMoreMessages || isLoadingMore || isLoading) return;

    setIsLoadingMore(true);
    isPaginatingRef.current = true; // Flag that we're paginating
    
    try {
      // Get the oldest message ID as cursor
      const oldestMessageId = messages[0]?.id;
      
      if (!oldestMessageId) {
        setHasMoreMessages(false);
        return;
      }

      // Fetch older messages
      const olderMessages = await fetchChannelMessages(teamId, activeChannel.id, {
        limit: 10,
        before: oldestMessageId
      });

      if (olderMessages && olderMessages.length > 0) {
        // Prepend older messages to the beginning
        setMessages(prev => [...olderMessages, ...prev]);
        
        // If we got less than 10, there are no more messages
        setHasMoreMessages(olderMessages.length === 10);
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.error('Failed to load more messages:', err);
      toast.error('Failed to load older messages');
    } finally {
      setIsLoadingMore(false);
      // Reset pagination flag after a brief delay to ensure layout effect completes
      setTimeout(() => {
        isPaginatingRef.current = false;
      }, 100);
    }
  }, [activeChannel, hasMoreMessages, isLoadingMore, isLoading, messages, teamId]);

  /**
   * Handle scroll to load more messages
   */
  const handleScroll = useCallback((e) => {
    const container = e.target;
    
    // Check if scrolled to top (with small threshold)
    if (container.scrollTop < 100 && hasMoreMessages && !isLoadingMore) {
      // Capture scroll height BEFORE loading new messages
      prevScrollHeightRef.current = container.scrollHeight;
      loadMoreMessages();
    }
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages]);

  /**
   * Handle file selection
   */
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file count
    if (selectedFiles.length + files.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed per message`);
      return;
    }
    
    // Validate each file
    const validFiles = [];
    for (const file of files) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        continue;
      }
      
      // Check file type
      if (!ALLOWED_FILE_TYPES.includes(file.type) && file.type !== '') {
        toast.error(`${file.name} has unsupported file type`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file(s) selected`);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Remove a selected file
   */
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Open file picker
   */
  const openFilePicker = () => {
    if (!activeChannel) {
      toast.error('Please select a channel first');
      return;
    }
    fileInputRef.current?.click();
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * Get file icon based on type
   */
  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️';
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return '🗜️';
    if (fileType.includes('javascript') || fileType.includes('python') || fileType.includes('java')) return '💻';
    return '📎';
  };

  /**
   * Search messages when debounced query changes
   */
  useEffect(() => {
    if (!debouncedSearchQuery || !activeChannel || !isSearchOpen) {
      setSearchResults([]);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const results = await searchMessages(teamId, activeChannel.id, debouncedSearchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error('Search failed:', err);
        toast.error('Failed to search messages');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchQuery, activeChannel, teamId, isSearchOpen]);

  /**
   * Subscribe to real-time message events
   */
  useEffect(() => {
    const unsubMessage = onNewMessage((message) => {
      // Only add if from current channel
      if (message.channel_id === activeChannel?.id) {
        setMessages(prev => [...prev, message]);
      }
    });

    const unsubTyping = onUserTyping(({ userId, username }) => {
      if (currentUser && userId !== currentUser.id) {
        setTypingUsers(prev => {
          if (!prev.find(u => u.userId === userId)) {
            return [...prev, { userId, username }];
          }
          return prev;
        });
      }
    });

    const unsubStopTyping = onUserStoppedTyping(({ userId }) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== userId));
    });

    return () => {
      unsubMessage();
      unsubTyping();
      unsubStopTyping();
    };
  }, [activeChannel?.id, currentUser]);

  /**
   * 1. HANDLE SCROLL POSITION (Layout Effect)
   * Runs synchronously immediately after DOM updates but BEFORE browser paint.
   * - Pagination: Restores previous position.
   * - Initial Load: Snaps instantly to bottom (no animation).
   */
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // CASE A: Pagination (Restoring position when loading old messages)
    if (prevScrollHeightRef.current) {
      const heightDifference = container.scrollHeight - prevScrollHeightRef.current;
      container.scrollTop = heightDifference;
      prevScrollHeightRef.current = null;
      return;
    }

    // CASE B: Initial Load (Snap to bottom instantly)
    // We check isInitialLoadRef but DON'T flip it to false yet 
    // (so useEffect knows to skip the animation)
    if (isInitialLoadRef.current && messages.length > 0) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  /**
   * 2. HANDLE NEW MESSAGES (Effect)
   * Runs after the screen has painted.
   * - Initial Load: Does nothing (already handled above).
   * - Chatting: Smooth scrolls to new messages.
   */
  useEffect(() => {
    // If paginating, do nothing
    if (isPaginatingRef.current) return;

    // If this was the initial load, mark it as done and SKIP the smooth scroll
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    // Only run smooth scroll for actual new messages while chatting
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * 3. AUTO-LOAD MORE MESSAGES IF CONTAINER ISN'T SCROLLABLE
   * Ensures users can always access pagination by making content scrollable
   */
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || isLoadingMore || !hasMoreMessages || messages.length === 0) return;

    // Check if container has scrollable content
    const hasScrollbar = container.scrollHeight > container.clientHeight;
    
    if (!hasScrollbar) {
      // Container isn't scrollable, auto-load more messages
      loadMoreMessages();
    }
  }, [messages, hasMoreMessages, isLoadingMore, loadMoreMessages]);


  // Categorize channels
  const generalChannels = channels.filter(c => !c.project_id);
  const projectChannels = channels.filter(c => c.project_id);
  
  // Group project channels by project name and ID
  const groupedProjectChannels = projectChannels.reduce((acc, channel) => {
    const pName = channel.project_name;
    const pId = channel.project_id;
    if (!acc[pName]) {
      acc[pName] = {
        projectId: pId,
        channels: []
      };
    }
    acc[pName].channels.push(channel);
    return acc;
  }, {});

  // Use ALL team projects for dropdown (not just those with channels)
  const availableProjects = teamProjects.map(project => ({
    id: project.id,
    name: project.name
  }));

  /**
   * Send message via Socket.io (with optional file attachments)
   */
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    
    const trimmedMessage = inputMessage.trim();
    
    // Require either message text or files
    if (!trimmedMessage && selectedFiles.length === 0) return;
    if (!activeChannel || isSending) return;
    
    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed.`);
      return;
    }

    setIsSending(true);
    setIsUploading(selectedFiles.length > 0);
    emitTypingStop(activeChannel.id);

    try {
      // If files are attached, upload them first
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append('content', trimmedMessage);
        formData.append('channelId', activeChannel.id);
        
        selectedFiles.forEach((file) => {
          formData.append('files', file);
        });
        
        // TODO: Call API endpoint to upload files and send message
        // For now, simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast.success('Files uploaded successfully!');
        console.log('[ChatPage] Would upload files:', selectedFiles.map(f => f.name));
        
        // Clear files after successful upload
        setSelectedFiles([]);
      } else {
        // Send text-only message via socket
        await socketSendMessage(activeChannel.id, trimmedMessage);
      }
      
      setInputMessage('');
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  }, [inputMessage, activeChannel, isSending, selectedFiles]);

  /**
   * Handle input change with typing indicator
   */
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputMessage(value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }

    // Emit typing indicator (debounced)
    if (activeChannel && value.trim()) {
      emitTypingStart(activeChannel.id);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        emitTypingStop(activeChannel.id);
      }, 2000);
    }
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  /**
   * Open modal for creating a channel
   * @param {Object} context - { type: 'global' } or { type: 'project', projectId, projectName }
   */
  const openCreateChannelModal = (context) => {
    setModalContext(context);
    setNewChannelName('');
    
    if (context.type === 'project') {
      setSelectedProjectId(context.projectId);
    } else if (context.type === 'team') {
      // Pre-select "Entire Team" option for team-level channels
      setSelectedProjectId('null');
    } else {
      setSelectedProjectId('');
    }
    
    setIsModalOpen(true);
  };

  /**
   * Close modal and reset state
   */
  const closeCreateChannelModal = () => {
    setIsModalOpen(false);
    setModalContext(null);
    setNewChannelName('');
    setSelectedProjectId('');
  };

  /**
   * Open search modal
   */
  const openSearch = () => {
    if (!activeChannel) {
      toast.error('Please select a channel first');
      return;
    }
    setIsSearchOpen(true);
  };

  /**
   * Close search modal and reset
   */
  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  /**
   * Handle channel creation
   */
  const handleCreateChannel = async (e) => {
    e.preventDefault();
    
    const trimmedName = newChannelName.trim();
    if (!trimmedName) {
      toast.error('Channel name is required');
      return;
    }
    
    // Validate selection (accept "null" string for team-level channels)
    if (!selectedProjectId && modalContext?.type === 'global') {
      toast.error('Please select where this channel belongs to');
      return;
    }
    
    setIsCreatingChannel(true);
    
    try {
      // Convert "null" string to actual null, otherwise convert to number
      const projectIdValue = selectedProjectId === "null" ? null : (selectedProjectId ? Number(selectedProjectId) : null);
      
      const channelData = {
        name: trimmedName,
        projectId: projectIdValue,
        type: 'text',
        isPrivate: false,
      };
      
      // Call API to create channel
      const newChannel = await createChannel(teamId, channelData);
      
      toast.success(`Channel "${trimmedName}" created successfully!`);
      closeCreateChannelModal();
      
      // Refresh channels list and projects
      const [updatedChannels, projectsData] = await Promise.all([
        fetchTeamChannels(teamId),
        getTeamProjects(teamId).catch(() => ({ data: [] }))
      ]);
      
      setChannels(updatedChannels);
      setTeamProjects(projectsData.data || []);
      
      // Auto-select the newly created channel
      if (newChannel) {
        setActiveChannel(newChannel);
      }
      
    } catch (err) {
      console.error('Failed to create channel:', err);
      const errorMessage = err.message || 'Failed to create channel. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsCreatingChannel(false);
    }
  };

  // Styles dynamic theo Dark Mode
  const bgBase = isDarkMode ? 'bg-dark-primary' : 'bg-gray-50';
  const bgSidebar = isDarkMode ? 'bg-dark-secondary border-r border-[#171717]' : 'bg-white border-r border-gray-200';
  const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const hoverBg = isDarkMode ? 'hover:bg-[#171717]' : 'hover:bg-gray-100';
  const inputBg = isDarkMode ? 'bg-[#171717] text-white border-[#333]' : 'bg-white text-black border-gray-300';

  /**
   * SUB-COMPONENT: Channel Item
   * Displays individual channel with active state and unread count
   */
  const ChannelItem = ({ channel }) => {
    const isActive = activeChannel?.id === channel.id;
    const activeClass = isActive 
      ? (isDarkMode ? 'bg-[#006239]/20 text-white' : 'bg-blue-50 text-blue-700') 
      : `${textSecondary} ${hoverBg}`;

    return (
      <button
        onClick={() => {
          setActiveChannel(channel);
          setMobileMenuOpen(false);
        }}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg mb-1 transition-colors ${activeClass}`}
      >
        <div className="flex items-center gap-2 truncate">
          {channel.type === 'voice' ? <Volume2 size={16} /> : <Hash size={16} />}
          <span className={`text-sm font-medium truncate ${channel.unread > 0 ? 'font-bold' : ''}`}>
            {channel.name}
          </span>
        </div>
        {channel.unread > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full min-w-[1.25rem]">
            {channel.unread}
          </span>
        )}
      </button>
    );
  };

  /**
   * SUB-COMPONENT: Channel Skeleton Loader
   * Shows loading state while fetching channels
   */
  const ChannelSkeleton = () => (
    <div className="space-y-2 px-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-2 px-3 py-2">
          <div className={`w-4 h-4 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} animate-pulse`} />
          <div className={`h-4 flex-1 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} animate-pulse`} />
        </div>
      ))}
    </div>
  );

  /**
   * SUB-COMPONENT: Message Bubble
   * Renders individual message with proper styling
   */
  const MessageBubble = ({ msg, isMe, isSequence }) => (
    <div 
      data-message-id={msg.id}
      className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} ${isSequence ? 'mt-1' : 'mt-4'} transition-all`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 ${isSequence ? 'invisible' : ''}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-300 text-black'}`}>
          {msg.user.username.substring(0,2).toUpperCase()}
        </div>
      </div>

      {/* Message Content */}
      <div className={`flex flex-col max-w-[75%] md:max-w-[60%] ${isMe ? 'items-end' : 'items-start'}`}>
        {!isSequence && (
          <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
            <span className={`text-sm font-bold ${textPrimary}`}>{msg.user.username}</span>
            <span className={`text-[10px] ${textSecondary}`}>
              {msg.created_at ? formatTimestamp(msg.created_at) : msg.timestamp}
            </span>
          </div>
        )}
        
        {/* Message Bubble - XSS Safe: React escapes text by default */}
        <div className={`px-4 py-2 rounded-2xl text-sm leading-relaxed break-words ${
          isMe 
            ? 'bg-[#006239] text-white rounded-tr-sm' 
            : `${isDarkMode ? 'bg-[#1F1F1F] text-gray-200' : 'bg-white border border-gray-200 text-gray-800 shadow-sm'} rounded-tl-sm`
        }`}>
          {msg.content}
        </div>
      </div>
    </div>
  );

  /**
   * SUB-COMPONENT: Message Skeleton Loader
   */
  const MessageSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-3">
          <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} animate-pulse`} />
          <div className="flex-1 space-y-2">
            <div className={`h-4 w-32 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} animate-pulse`} />
            <div className={`h-16 w-3/4 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} animate-pulse`} />
          </div>
        </div>
      ))}
    </div>
  );

  /**
   * SUB-COMPONENT: Empty State
   */
  const EmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <Hash size={64} className={`${textSecondary} mb-4`} />
      <h3 className={`text-xl font-bold ${textPrimary} mb-2`}>
        Welcome to #{activeChannel.name}
      </h3>
      <p className={`${textSecondary} max-w-md`}>
        This is the beginning of the <span className="font-semibold">#{activeChannel.name}</span> channel.
        {activeChannel.project_name && ` This channel is part of the ${activeChannel.project_name} project.`}
      </p>
    </div>
  );

  /**
   * SUB-COMPONENT: No Team Selected State
   */
  const NoTeamState = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
        isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'
      }`}>
        <Users size={32} className="text-blue-500" />
      </div>
      <h3 className={`text-2xl font-bold ${textPrimary} mb-3`}>
        You're Not in Any Team Yet
      </h3>
      <p className={`text-sm ${textSecondary} max-w-md mb-6`}>
        To start chatting, you need to create your first team or wait for an invitation to join an existing team.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className={`px-6 py-3 rounded-lg font-semibold transition-all ${
          isDarkMode 
            ? 'bg-[#006239] hover:bg-[#005230] text-white' 
            : 'bg-[#006239] hover:bg-[#005230] text-white'
        }`}
      >
        Go to Dashboard
      </button>
    </div>
  );

  // If no teamId, show no team selected state
  if (!teamId) {
    return (
      <div className={`flex h-[calc(100vh-64px)] ${bgBase}`}>
        <NoTeamState />
      </div>
    );
  }

  // Show loading state while fetching user
  if (isLoadingUser) {
    return (
      <div className={`flex h-[calc(100vh-64px)] items-center justify-center ${bgBase}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#006239] border-t-transparent rounded-full animate-spin" />
          <p className={textSecondary}>Loading user information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-[calc(100vh-64px)] ${bgBase}`}>
      
      {/* Create Channel Modal */}
      <CreateChannelModal
        isModalOpen={isModalOpen}
        modalContext={modalContext}
        availableProjects={availableProjects}
        newChannelName={newChannelName}
        setNewChannelName={setNewChannelName}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        isCreatingChannel={isCreatingChannel}
        closeCreateChannelModal={closeCreateChannelModal}
        handleCreateChannel={handleCreateChannel}
        isDarkMode={isDarkMode}
      />

      {/* Search Messages Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm pt-20">
          <div className={`w-full max-w-2xl rounded-xl shadow-2xl ${isDarkMode ? 'bg-dark-secondary' : 'bg-white'} max-h-[80vh] flex flex-col`}>
            {/* Search Header */}
            <div className={`flex items-center gap-3 px-6 py-4 border-b ${isDarkMode ? 'border-[#171717]' : 'border-gray-200'}`}>
              <Search size={20} className={textSecondary} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search in #${activeChannel?.name}...`}
                className={`flex-1 bg-transparent border-none focus:ring-0 focus:outline-none ${textPrimary}`}
                autoFocus
              />
              <button
                onClick={closeSearch}
                className={`p-1 rounded-lg ${hoverBg} ${textSecondary}`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto p-4">
              {!searchQuery.trim() ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search size={48} className={`${textSecondary} mb-4`} />
                  <p className={`${textSecondary}`}>Type to search messages</p>
                </div>
              ) : isSearching ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
                      <div className="flex-1 space-y-2">
                        <div className={`h-4 w-32 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
                        <div className={`h-16 w-full rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search size={48} className={`${textSecondary} mb-4`} />
                  <p className={`${textPrimary} font-semibold mb-1`}>No messages found</p>
                  <p className={`${textSecondary} text-sm`}>Try a different search term</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className={`text-sm ${textSecondary} mb-3`}>
                    Found {searchResults.length} {searchResults.length === 1 ? 'message' : 'messages'}
                  </p>
                  {searchResults.map(msg => {
                    const highlightedContent = msg.content.replace(
                      new RegExp(`(${searchQuery})`, 'gi'),
                      '<mark class="bg-yellow-300 dark:bg-yellow-600">$1</mark>'
                    );
                    
                    return (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          isDarkMode 
                            ? 'bg-[#1F1F1F] border-[#333] hover:bg-[#252525]' 
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          closeSearch();
                          // Scroll to message if it's already loaded
                          const messageElement = document.querySelector(`[data-message-id="${msg.id}"]`);
                          if (messageElement) {
                            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            messageElement.classList.add('ring-2', 'ring-yellow-400');
                            setTimeout(() => {
                              messageElement.classList.remove('ring-2', 'ring-yellow-400');
                            }, 2000);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-300 text-black'
                          }`}>
                            {msg.user?.username?.substring(0,2).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className={`text-sm font-bold ${textPrimary}`}>
                                {msg.user?.username || 'Unknown User'}
                              </span>
                              <span className={`text-xs ${textSecondary}`}>
                                {formatTimestamp(msg.created_at)}
                              </span>
                            </div>
                            <div 
                              className={`text-sm ${textPrimary} break-words`}
                              dangerouslySetInnerHTML={{ __html: highlightedContent }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Connection Status Indicator */}
      {!isConnected && (
        <div className="fixed top-16 left-0 right-0 z-50 bg-yellow-500 text-black text-center py-1 text-sm flex items-center justify-center gap-2">
          <WifiOff size={16} />
          <span>Reconnecting to chat server...</span>
        </div>
      )}
      
      {/* LEFT SIDEBAR (Channel List) */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${bgSidebar} ${mobileMenuOpen ? 'translate-x-0 pt-16 md:pt-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className={`p-4 border-b ${isDarkMode ? 'border-[#171717]' : 'border-gray-200'}`}>
            <h2 className={`font-bold text-lg ${textPrimary} flex items-center justify-between`}>
              {teamData?.name || 'Channels'}
              <button 
                className={`p-1 rounded ${hoverBg} transition-colors`}
                onClick={() => openCreateChannelModal({ type: 'global' })}
                title="Create new channel"
              >
                <Plus size={18} />
              </button>
            </h2>
          </div>

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-6">
            
            {isLoadingChannels ? (
              <ChannelSkeleton />
            ) : channelError ? (
              <div className="px-3 py-4">
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                    {channelError}
                  </p>
                </div>
              </div>
            ) : channels.length === 0 ? (
              <div className="px-3 py-4">
                <p className={`text-sm ${textSecondary}`}>
                  No channels found for this team.
                </p>
              </div>
            ) : (
              <>
                {/* 1. TEAM CHANNELS */}
                {generalChannels.length > 0 && (
                  <div>
                    <div className={`flex items-center justify-between px-3 mb-2 group`}>
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${textSecondary}`}>
                        Team Channels
                      </h3>
                      <button
                        onClick={() => openCreateChannelModal({ 
                          type: 'team', 
                          projectId: null, 
                          projectName: null 
                        })}
                        className={`p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${hoverBg}`}
                        title="Add team channel"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    {generalChannels.map(channel => (
                      <ChannelItem key={channel.id} channel={channel} />
                    ))}
                  </div>
                )}

                {/* 2. PROJECT CHANNELS (Grouped) */}
                {Object.entries(groupedProjectChannels).map(([projectName, data]) => (
                  <div key={projectName}>
                    <div className={`flex items-center justify-between px-3 mt-4 mb-2 group`}>
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${textSecondary} truncate`}>
                        {projectName}
                      </h3>
                      <button
                        onClick={() => openCreateChannelModal({ 
                          type: 'project', 
                          projectId: data.projectId, 
                          projectName 
                        })}
                        className={`p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${hoverBg}`}
                        title={`Add channel to ${projectName}`}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    {data.channels.map(channel => (
                      <ChannelItem key={channel.id} channel={channel} />
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* OVERLAY for Mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* RIGHT MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent">
        
        {/* Chat Header */}
        <div className={`h-16 px-4 md:px-6 flex items-center justify-between border-b flex-shrink-0 ${isDarkMode ? 'bg-dark-secondary border-[#171717]' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-1 -ml-2 mr-1"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={24} className={textPrimary} />
            </button>
            
            {activeChannel ? (
              <div className="flex items-center gap-2">
                {activeChannel.type === 'voice' ? <Volume2 size={24} className={textSecondary} /> : <Hash size={24} className={textSecondary} />}
                <div>
                  <h3 className={`font-bold ${textPrimary}`}>
                    {activeChannel.name}
                  </h3>
                  <p className={`text-xs ${textSecondary}`}>
                    {activeChannel.project_name ? `Project: ${activeChannel.project_name}` : 'General Team Chat'}
                  </p>
                </div>
              </div>
            ) : (
              <div className={`${textSecondary}`}>Select a channel</div>
            )}
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex -space-x-2 mr-4">
              {[1,2,3].map(i => (
                <div key={i} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${isDarkMode ? 'border-dark-secondary bg-gray-700' : 'border-white bg-gray-200'}`}>
                  U{i}
                </div>
              ))}
            </div>
            <button 
              onClick={openSearch}
              className={`p-2 rounded-full ${hoverBg} ${textSecondary} ${!activeChannel ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Search in channel"
              disabled={!activeChannel}
            >
              <Search size={20} />
            </button>
            <button 
              onClick={() => setIsInfoOpen(!isInfoOpen)}
              className={`p-2 rounded-full transition-colors ${
                isInfoOpen 
                  ? 'bg-[#006239] text-white hover:bg-[#005230]' 
                  : `${hoverBg} ${textSecondary}`
              } ${!activeChannel ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Channel info"
              disabled={!activeChannel}
            >
              <Info size={20} />
            </button>
          </div>
        </div>

        {/* Messages List Area */}
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 md:p-6"
        >
          {!activeChannel ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <Hash size={64} className={`${textSecondary} mb-4`} />
              <h3 className={`text-xl font-bold ${textPrimary} mb-2`}>
                Welcome to Chat
              </h3>
              <p className={`${textSecondary} max-w-md`}>
                Select a channel from the sidebar to start chatting.
              </p>
            </div>
          ) : isLoading ? (
            <MessageSkeleton />
          ) : messageError ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                  {messageError}
                </p>
                <button 
                  onClick={() => {
                    setMessageError(null);
                    setActiveChannel({ ...activeChannel }); // Trigger re-fetch
                  }}
                  className="mt-2 text-sm underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Load More Button (when messages don't fill the container) */}
              {hasMoreMessages && !isLoadingMore && (
                <div className="flex justify-center py-4">
                  <button
                    onClick={loadMoreMessages}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDarkMode 
                        ? 'bg-[#1F1F1F] hover:bg-[#2A2A2A] text-gray-300 border border-[#333]' 
                        : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm'
                    }`}
                  >
                    Load older messages
                  </button>
                </div>
              )}
              
              {/* Load More Indicator */}
              {isLoadingMore && (
                <div className="flex justify-center py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>Loading older messages...</span>
                  </div>
                </div>
              )}
              
              {/* No More Messages Indicator */}
              {!hasMoreMessages && messages.length > 0 && (
                <div className="flex justify-center py-4">
                  <span className={`text-xs ${textSecondary}`}>
                    Beginning of conversation
                  </span>
                </div>
              )}
              
              <div className="space-y-1">
                {messages.map((msg, index) => {
                  const isMe = currentUser && msg.user_id === currentUser.id;
                  const isSequence = index > 0 && messages[index-1].user_id === msg.user_id;

                  return (
                    <MessageBubble 
                      key={msg.id} 
                      msg={msg} 
                      isMe={isMe} 
                      isSequence={isSequence} 
                    />
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </>
          )}
          
          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className={`flex items-center gap-2 mt-2 ${textSecondary} text-sm`}>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>
                {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={`p-4 border-t flex-shrink-0 ${isDarkMode ? 'bg-dark-secondary border-[#171717]' : 'bg-white border-gray-200'}`}>
          {/* File Preview Area */}
          {selectedFiles.length > 0 && (
            <div className="mb-3 space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${isDarkMode ? 'bg-[#1F1F1F] border-[#333]' : 'bg-gray-50 border-gray-200'}`}
                >
                  <span className="text-2xl">{getFileIcon(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${textPrimary}`}>
                      {file.name}
                    </p>
                    <p className={`text-xs ${textSecondary}`}>
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className={`p-1 rounded-lg ${hoverBg} ${textSecondary} hover:text-red-500`}
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_FILE_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className={`flex items-end gap-2 p-2 rounded-xl border ${inputBg} focus-within:ring-2 focus-within:ring-[#006239]/50 transition-all ${!activeChannel ? 'opacity-50' : ''}`}>
            
            <button 
              onClick={openFilePicker}
              className={`p-2 rounded-lg ${hoverBg} ${textSecondary} flex-shrink-0 ${selectedFiles.length >= MAX_FILES ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={selectedFiles.length >= MAX_FILES ? `Maximum ${MAX_FILES} files` : 'Attach file'}
              disabled={!activeChannel || selectedFiles.length >= MAX_FILES}
            >
              <Paperclip size={20} />
            </button>
            
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e).then(() => {
                    // Refocus after message is sent
                    setTimeout(() => {
                      textareaRef.current?.focus();
                    }, 0);
                  });
                }
              }}
              placeholder={activeChannel ? `Message #${activeChannel.name}` : 'Select a channel to start chatting'}
              className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none max-h-32 min-h-[24px] py-2 resize-none text-sm scrollbar-hide"
              rows={1}
              maxLength={MAX_MESSAGE_LENGTH}
              disabled={!activeChannel || isSending}
            />

            <div className="flex items-center gap-1 pb-1">
               <button 
                className={`p-2 rounded-lg ${hoverBg} ${textSecondary}`}
                title="Add emoji"
                disabled={!activeChannel}
              >
                <Smile size={20} />
              </button>
              <button 
                onClick={handleSendMessage}
                disabled={(!inputMessage.trim() && selectedFiles.length === 0) || !activeChannel || isSending}
                className={`p-2 rounded-lg transition-all ${
                  (inputMessage.trim() || selectedFiles.length > 0) && activeChannel && !isSending
                    ? 'bg-[#006239] text-white hover:bg-[#005230]' 
                    : `${isDarkMode ? 'bg-[#333]' : 'bg-gray-200'} ${textSecondary} cursor-not-allowed`
                }`}
                title={isUploading ? 'Uploading files...' : 'Send message'}
              >
                {isUploading ? (
                  <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>
          <div className={`flex items-center justify-between text-xs mt-2 ${textSecondary}`}>
            <span>
              <strong>Tip:</strong> Press Enter to send, Shift + Enter for new line{selectedFiles.length > 0 && ` • ${selectedFiles.length}/${MAX_FILES} files`}
            </span>
            <span className={inputMessage.length > MAX_MESSAGE_LENGTH * 0.9 ? 'text-red-500 font-semibold' : ''}>
              {inputMessage.length}/{MAX_MESSAGE_LENGTH}
            </span>
          </div>
        </div>

      </div>

      {/* CHANNEL INFO SIDEBAR */}
      {isInfoOpen && activeChannel && (
        <div className={`w-80 border-l flex-shrink-0 overflow-y-auto ${isDarkMode ? 'bg-dark-secondary border-[#171717]' : 'bg-white border-gray-200'}`}>
          {/* Info Header */}
          <div className={`p-4 border-b ${isDarkMode ? 'border-[#171717]' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-bold text-lg ${textPrimary}`}>Channel Info</h3>
              <button
                onClick={() => setIsInfoOpen(false)}
                className={`p-1 rounded-lg ${hoverBg} ${textSecondary}`}
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {activeChannel.type === 'voice' ? <Volume2 size={20} className={textSecondary} /> : <Hash size={20} className={textSecondary} />}
              <div>
                <h4 className={`font-semibold ${textPrimary}`}>{activeChannel.name}</h4>
                <p className={`text-xs ${textSecondary}`}>
                  {activeChannel.project_name || 'Team Channel'}
                </p>
              </div>
            </div>
          </div>

          {/* Notifications Toggle */}
          <div className={`p-4 border-b ${isDarkMode ? 'border-[#171717]' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {notificationsEnabled ? (
                  <Bell size={20} className={textSecondary} />
                ) : (
                  <BellOff size={20} className={textSecondary} />
                )}
                <div>
                  <p className={`text-sm font-medium ${textPrimary}`}>Notifications</p>
                  <p className={`text-xs ${textSecondary}`}>
                    {notificationsEnabled ? 'Enabled' : 'Muted'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  notificationsEnabled ? 'bg-[#006239]' : isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Files Section */}
          <div className={`border-b ${isDarkMode ? 'border-[#171717]' : 'border-gray-200'}`}>
            <button
              className={`w-full p-4 flex items-center justify-between ${hoverBg}`}
              onClick={() => {}}
            >
              <div className="flex items-center gap-2">
                <FileText size={18} className={textSecondary} />
                <span className={`font-medium ${textPrimary}`}>File</span>
              </div>
              <ChevronDown size={18} className={textSecondary} />
            </button>
            <div className="px-4 pb-4 space-y-2">
              {channelFiles.length === 0 ? (
                <p className={`text-sm text-center py-4 ${textSecondary}`}>
                  No files shared yet
                </p>
              ) : (
                channelFiles.map(file => (
                  <div
                    key={file.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isDarkMode
                        ? 'bg-[#1F1F1F] border-[#333] hover:bg-[#252525]'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 ${
                      file.type === 'video' ? 'bg-purple-500' :
                      file.type === 'document' ? 'bg-blue-500' :
                      'bg-cyan-500'
                    }`}>
                      <FileText size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${textPrimary}`}>
                        {file.name}
                      </p>
                      <div className={`flex items-center gap-2 text-xs ${textSecondary}`}>
                        <span>{file.size}</span>
                        <span>•</span>
                        <span>{file.date}</span>
                      </div>
                    </div>
                    <button
                      className={`p-1.5 rounded ${hoverBg}`}
                      title="Download"
                    >
                      <Download size={16} className={textSecondary} />
                    </button>
                  </div>
                ))
              )}
              {channelFiles.length > 0 && (
                <button className={`w-full text-center text-sm py-2 ${textSecondary} hover:underline`}>
                  View all files
                </button>
              )}
            </div>
          </div>

          {/* Links Section */}
          <div>
            <button
              className={`w-full p-4 flex items-center justify-between ${hoverBg}`}
              onClick={() => {}}
            >
              <div className="flex items-center gap-2">
                <LinkIcon size={18} className={textSecondary} />
                <span className={`font-medium ${textPrimary}`}>Link</span>
              </div>
              <ChevronDown size={18} className={textSecondary} />
            </button>
            <div className="px-4 pb-4">
              {channelLinks.length === 0 ? (
                <p className={`text-sm text-center py-8 ${textSecondary}`}>
                  No links shared yet
                </p>
              ) : (
                <div className="space-y-2">
                  {channelLinks.map(link => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isDarkMode
                          ? 'bg-[#1F1F1F] border-[#333] hover:bg-[#252525]'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <ExternalLink size={16} className={textSecondary} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${textPrimary}`}>
                          {link.title || link.url}
                        </p>
                        <p className={`text-xs truncate ${textSecondary}`}>
                          {link.domain}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}