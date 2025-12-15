import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
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
  ChevronDown
} from 'lucide-react';
import { fetchTeamChannels, fetchChannelMessages } from './services/channelApi.js';
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

// TODO: Replace with actual user from auth context
const CURRENT_USER_ID = 1; // Mock user ID for development
const MAX_MESSAGE_LENGTH = 2000; // Character limit for messages (matches DB constraint)

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
          
          {/* Project Selector */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${textPrimary}`}>
              Project {isProjectLocked && <span className={`text-xs font-normal ${textSecondary}`}>(locked)</span>}
            </label>
            
            {isProjectLocked ? (
              <div className={`w-full px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-[#171717] border-[#333] text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-600'} cursor-not-allowed`}>
                {modalContext.projectName}
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
                  <option value="">-- Select a Project --</option>
                  {availableProjects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
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
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const previousChannelRef = useRef(null);

  /**
   * Initialize Socket connection on mount
   */
  useEffect(() => {
    const socket = initSocket(CURRENT_USER_ID);
    
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    return () => {
      disconnectSocket();
    };
  }, []);

  /**
   * Fetch channels when teamId changes
   */
  useEffect(() => {
    if (!teamId) {
      // No team selected - stop loading and show empty state
      setIsLoadingChannels(false);
      setChannels([]);
      return;
    }

    const loadChannels = async () => {
      console.log('[ChatPage] Fetching channels for team:', teamId);
      setIsLoadingChannels(true);
      setChannelError(null);
      try {
        const data = await fetchTeamChannels(teamId);
        console.log('[ChatPage] Received channels:', data);
        setChannels(data);
        // Auto-select first channel if none selected
        if (data.length > 0 && !activeChannel) {
          console.log('[ChatPage] Auto-selecting first channel:', data[0]);
          setActiveChannel(data[0]);
        }
      } catch (err) {
        console.error('[ChatPage] Failed to fetch channels:', err);
        setChannelError(err.message || 'Failed to load channels');
      } finally {
        setIsLoadingChannels(false);
      }
    };

    loadChannels();
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

      // Leave previous channel room
      if (previousChannelRef.current && previousChannelRef.current !== activeChannel.id) {
        await leaveChannel(previousChannelRef.current).catch(console.error);
      }

      try {
        // Join new channel room for real-time updates
        await joinChannel(activeChannel.id);
        
        // Fetch message history
        const data = await fetchChannelMessages(teamId, activeChannel.id);
        setMessages(data || []);
        
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
      if (userId !== CURRENT_USER_ID) {
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
  }, [activeChannel?.id]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  // Extract unique projects for dropdown
  const availableProjects = Object.entries(groupedProjectChannels).map(([name, data]) => ({
    id: data.projectId,
    name
  }));

  /**
   * Send message via Socket.io
   */
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage || !activeChannel || isSending) return;
    
    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      alert(`Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed.`);
      return;
    }

    setIsSending(true);
    emitTypingStop(activeChannel.id);

    try {
      // Send via socket (message will be broadcast back via 'new-message' event)
      await socketSendMessage(activeChannel.id, trimmedMessage);
      setInputMessage('');
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [inputMessage, activeChannel, isSending]);

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
   * Handle channel creation
   */
  const handleCreateChannel = async (e) => {
    e.preventDefault();
    
    const trimmedName = newChannelName.trim();
    if (!trimmedName) {
      alert('Channel name is required');
      return;
    }
    
    if (!selectedProjectId && modalContext?.type === 'global') {
      alert('Please select a project');
      return;
    }
    
    setIsCreatingChannel(true);
    
    try {
      // TODO: Implement API call to create channel
      console.log('Creating channel:', {
        name: trimmedName,
        projectId: selectedProjectId,
        teamId
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      alert(`Channel "${trimmedName}" created successfully!`);
      closeCreateChannelModal();
      
      // TODO: Refresh channels list or optimistically add to state
      
    } catch (err) {
      console.error('Failed to create channel:', err);
      alert('Failed to create channel. Please try again.');
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
    <div className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} ${isSequence ? 'mt-1' : 'mt-4'}`}>
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
      <Hash size={64} className={`${textSecondary} mb-4`} />
      <h3 className={`text-xl font-bold ${textPrimary} mb-2`}>
        No Team Selected
      </h3>
      <p className={`${textSecondary} max-w-md mb-4`}>
        Please select a team from the sidebar to start chatting.
      </p>
      <a 
        href="/dashboard" 
        className="px-4 py-2 bg-[#006239] text-white rounded-lg hover:bg-[#005230] transition-colors"
      >
        Go to Dashboard
      </a>
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
              Channels
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
                    <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 px-3 ${textSecondary}`}>
                      Team Channels
                    </h3>
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
              className={`p-2 rounded-full ${hoverBg} ${textSecondary}`}
              title="Search in channel"
            >
              <Search size={20} />
            </button>
            <button 
              className={`p-2 rounded-full ${hoverBg} ${textSecondary}`}
              title="Channel info"
            >
              <Info size={20} />
            </button>
          </div>
        </div>

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
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
            <div className="space-y-1">
              {messages.map((msg, index) => {
                const isMe = msg.user_id === CURRENT_USER_ID;
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
          <div className={`flex items-end gap-2 p-2 rounded-xl border ${inputBg} focus-within:ring-2 focus-within:ring-[#006239]/50 transition-all ${!activeChannel ? 'opacity-50' : ''}`}>
            
            <button 
              className={`p-2 rounded-lg ${hoverBg} ${textSecondary} flex-shrink-0`}
              title="Attach file"
              disabled={!activeChannel}
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
                  handleSendMessage(e);
                }
              }}
              placeholder={activeChannel ? `Message #${activeChannel.name}` : 'Select a channel to start chatting'}
              className="flex-1 bg-transparent border-none focus:ring-0 max-h-32 min-h-[24px] py-2 resize-none text-sm scrollbar-hide"
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
                disabled={!inputMessage.trim() || !activeChannel || isSending}
                className={`p-2 rounded-lg transition-all ${
                  inputMessage.trim() && activeChannel && !isSending
                    ? 'bg-[#006239] text-white hover:bg-[#005230]' 
                    : `${isDarkMode ? 'bg-[#333]' : 'bg-gray-200'} ${textSecondary} cursor-not-allowed`
                }`}
                title="Send message"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
          <div className={`flex items-center justify-between text-xs mt-2 ${textSecondary}`}>
            <span>
              <strong>Tip:</strong> Press Enter to send, Shift + Enter for new line
            </span>
            <span className={inputMessage.length > MAX_MESSAGE_LENGTH * 0.9 ? 'text-red-500 font-semibold' : ''}>
              {inputMessage.length}/{MAX_MESSAGE_LENGTH}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}