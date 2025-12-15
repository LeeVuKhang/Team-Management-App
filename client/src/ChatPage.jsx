import React, { useState, useEffect, useRef } from 'react';
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
  Info
} from 'lucide-react';

/**
 * MOCK DATA (Mô phỏng dữ liệu từ DB)
 */
const MOCK_CHANNELS = [
  // General Team Channels (project_id: null)
  { id: 1, name: 'general', type: 'text', project_id: null, unread: 0 },
  { id: 2, name: 'announcements', type: 'text', project_id: null, unread: 3 },
  { id: 3, name: 'random', type: 'text', project_id: null, unread: 0 },

  // Project Specific Channels (Có project_id)
  { id: 5, name: 'dev-backend', type: 'text', project_id: 101, project_name: 'Website Revamp' },
  { id: 6, name: 'dev-frontend', type: 'text', project_id: 101, project_name: 'Website Revamp' },
  { id: 7, name: 'marketing-campaign', type: 'text', project_id: 102, project_name: 'Q4 Marketing' },
];

const MOCK_MESSAGES = [
  { id: 1, user_id: 99, content: 'Hello everyone! Welcome to the new team workspace.', timestamp: '10:00 AM', user: { username: 'Admin', avatar_url: null } },
  { id: 2, user_id: 2, content: 'Giao diện nhìn xịn quá sếp ơi!', timestamp: '10:05 AM', user: { username: 'Khang Le', avatar_url: null } },
  { id: 3, user_id: 99, content: 'Thanks! Mọi người check phần Projects nhé.', timestamp: '10:06 AM', user: { username: 'Admin', avatar_url: null } },
  // Giả lập tin nhắn dài
  { id: 4, user_id: 2, content: 'Skibidi toilet qua ae, nhai discord', timestamp: '10:10 AM', user: { username: 'Khang Le', avatar_url: null } },
];

const CURRENT_USER_ID = 2; // Giả lập ID của người đang login
const MAX_MESSAGE_LENGTH = 2000; // Character limit for messages (matches DB constraint)

export default function ChatPage() {
  const { isDarkMode } = useOutletContext();
  const { teamId } = useParams();
  
  const [activeChannel, setActiveChannel] = useState(MOCK_CHANNELS[0]);
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [inputMessage, setInputMessage] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto scroll to bottom khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Phân loại Channels
  const generalChannels = MOCK_CHANNELS.filter(c => !c.project_id);
  const projectChannels = MOCK_CHANNELS.filter(c => c.project_id);
  
  // Gom nhóm project channels theo Project Name (Logic hiển thị đẹp hơn)
  const groupedProjectChannels = projectChannels.reduce((acc, channel) => {
    const pName = channel.project_name;
    if (!acc[pName]) acc[pName] = [];
    acc[pName].push(channel);
    return acc;
  }, {});

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    // Input validation: Trim and check if empty
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage) return;
    
    // Validate message length to prevent exceeding DB constraint
    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      alert(`Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed.`);
      return;
    }

    const newMsg = {
      id: Date.now(),
      user_id: CURRENT_USER_ID,
      content: trimmedMessage, // Use trimmed content
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: { username: 'You', avatar_url: null }
    };

    setMessages([...messages, newMsg]);
    setInputMessage('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Auto-resize textarea as user types
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputMessage(value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
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
    const isActive = activeChannel.id === channel.id;
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
            <span className={`text-[10px] ${textSecondary}`}>{msg.timestamp}</span>
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

  return (
    <div className={`flex h-[calc(100vh-64px)] ${bgBase}`}>
      
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
              <button className={`p-1 rounded ${hoverBg}`}>
                <Plus size={18} />
              </button>
            </h2>
          </div>

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-6">
            
            {isLoadingChannels ? (
              <ChannelSkeleton />
            ) : (
              <>
                {/* 1. TEAM CHANNELS */}
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 px-3 ${textSecondary}`}>
                    Team Channels
                  </h3>
                  {generalChannels.map(channel => (
                    <ChannelItem key={channel.id} channel={channel} />
                  ))}
                </div>

                {/* 2. PROJECT CHANNELS (Grouped) */}
                {Object.entries(groupedProjectChannels).map(([projectName, channels]) => (
                  <div key={projectName}>
                    <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 px-3 mt-4 ${textSecondary} flex items-center gap-1`}>
                      <span className="truncate">{projectName}</span>
                    </h3>
                    {channels.map(channel => (
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
          {isLoading ? (
            <MessageSkeleton />
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
        </div>

        {/* Input Area */}
        <div className={`p-4 border-t flex-shrink-0 ${isDarkMode ? 'bg-dark-secondary border-[#171717]' : 'bg-white border-gray-200'}`}>
          <div className={`flex items-end gap-2 p-2 rounded-xl border ${inputBg} focus-within:ring-2 focus-within:ring-[#006239]/50 transition-all`}>
            
            <button 
              className={`p-2 rounded-lg ${hoverBg} ${textSecondary} flex-shrink-0`}
              title="Attach file"
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
              placeholder={`Message #${activeChannel.name}`}
              className="flex-1 bg-transparent border-none focus:ring-0 max-h-32 min-h-[24px] py-2 resize-none text-sm scrollbar-hide"
              rows={1}
              maxLength={MAX_MESSAGE_LENGTH}
            />

            <div className="flex items-center gap-1 pb-1">
               <button 
                className={`p-2 rounded-lg ${hoverBg} ${textSecondary}`}
                title="Add emoji"
              >
                <Smile size={20} />
              </button>
              <button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className={`p-2 rounded-lg transition-all ${
                  inputMessage.trim() 
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