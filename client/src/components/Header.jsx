import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Bell, Plus, Menu, Sun, Moon, FileText, LogOut, User, HelpCircle, Check, X, Clock } from 'lucide-react';
import { getUserInvitations, acceptInvitation, declineInvitation } from '../services/projectApi';

export default function Header({ isDarkMode, toggleDarkMode }) {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isNotificationOpen, setNotificationOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notificationRef = useRef(null);
  const avatarRef = useRef(null);

  // Fetch pending invitations
  const { data: invitationsData } = useQuery({
    queryKey: ['userInvitations'],
    queryFn: getUserInvitations,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const invitations = invitationsData?.data || [];

  // Accept invitation mutation
  const acceptMutation = useMutation({
    mutationFn: (token) => acceptInvitation(token),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['userInvitations']);
      setNotificationOpen(false);
      // Redirect to the team page
      navigate(`/teams/${data.data.teamId}`);
    },
  });

  // Decline invitation mutation
  const declineMutation = useMutation({
    mutationFn: (token) => declineInvitation(token),
    onSuccess: () => {
      queryClient.invalidateQueries(['userInvitations']);
    },
  });

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };

    if (isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationOpen]);

  // Close avatar dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (avatarRef.current && !avatarRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/');
  };

  const bgHeader = isDarkMode ? 'bg-dark-primary/80 border-[#1F1F1F]' : 'bg-white/80 border-gray-200';
  const inputBg = isDarkMode ? 'bg-dark-secondary border-[#171717] text-gray-100 placeholder:text-gray-500' : 'bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500';

  return (
    <header className={`h-16 backdrop-blur-md border-b flex items-center justify-between px-6 sticky top-0 z-10 transition-colors duration-300 ${bgHeader}`}>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-[#171717]' : 'bg-gray-200'}`}>
            <span className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>T</span>
          </div>
          <span className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Team Hub</span>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
        <div className="relative group">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-gray-400' : 'text-gray-500 group-focus-within:text-gray-700'}`} size={16} />
          <input 
            type="text" 
            placeholder="Search..." 
            className={`w-80 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 transition-all ${isDarkMode ? 'focus:ring-[#1F1F1F] focus:border-[#1F1F1F]' : 'focus:ring-gray-400 focus:border-gray-400'} ${inputBg}`}
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        <button 
          onClick={toggleDarkMode}
          className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-[#1F1F1F]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notification Bell with Dropdown */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setNotificationOpen(!isNotificationOpen)}
            className={`relative p-2 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <Bell size={20} />
            {invitations.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-inherit"></span>
            )}
          </button>

          {/* Notification Dropdown */}
          {isNotificationOpen && (
            <div className={`absolute right-0 mt-2 w-96 rounded-xl shadow-lg border overflow-hidden z-50 ${
              isDarkMode ? 'bg-dark-secondary border-[#171717]' : 'bg-white border-gray-200'
            }`}>
              <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-[#171717]' : 'border-gray-200'}`}>
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Team Invitations
                </h3>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {invitations.length} pending {invitations.length === 1 ? 'invitation' : 'invitations'}
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {invitations.length === 0 ? (
                  <div className={`p-6 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Bell size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No pending invitations</p>
                  </div>
                ) : (
                  invitations.map((invite) => (
                    <div 
                      key={invite.id}
                      className={`p-4 border-b transition-colors ${
                        isDarkMode ? 'border-[#171717] hover:bg-gray-800' : 'border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Inviter Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isDarkMode ? 'bg-[rgb(119,136,115)]' : 'bg-[rgb(210,220,182)]'
                        }`}>
                          <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-white' : 'text-[rgb(60,68,58)]'
                          }`}>
                            {invite.inviter_name?.substring(0, 2).toUpperCase() || 'TM'}
                          </span>
                        </div>

                        {/* Invitation Info */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <span className="font-semibold">{invite.inviter_name || 'Someone'}</span> invited you to join
                          </p>
                          <p className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {invite.team_name}
                          </p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${
                              invite.role === 'admin'
                                ? 'bg-purple-500/10 text-purple-500'
                                : 'bg-blue-500/10 text-blue-500'
                            }`}>
                              {invite.role}
                            </span>
                            <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>•</span>
                            <span className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              <Clock size={12} />
                              {new Date(invite.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => acceptMutation.mutate(invite.token)}
                              disabled={acceptMutation.isPending || declineMutation.isPending}
                              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                isDarkMode
                                  ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                  : 'bg-green-50 text-green-600 hover:bg-green-100'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              <Check size={14} />
                              {acceptMutation.isPending ? 'Accepting...' : 'Accept'}
                            </button>
                            <button
                              onClick={() => declineMutation.mutate(invite.token)}
                              disabled={acceptMutation.isPending || declineMutation.isPending}
                              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                isDarkMode
                                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                  : 'bg-red-50 text-red-600 hover:bg-red-100'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              <X size={14} />
                              {declineMutation.isPending ? 'Declining...' : 'Decline'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className={`h-8 w-[1px] mx-2 ${isDarkMode ? 'bg-[#1F1F1F]' : 'bg-gray-200'}`}></div>

        <div className="relative" ref={avatarRef}>
          <button 
            onClick={() => setDropdownOpen(!isDropdownOpen)}
            className={`h-10 w-10 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all hover:ring-2 ${isDarkMode ? 'bg-dark-secondary border-[#171717] hover:ring-[#1F1F1F]' : 'bg-gray-100 border-gray-300 hover:ring-gray-400 shadow-sm'}`}
          >
            <User size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>

          {isDropdownOpen && (
            <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg border overflow-hidden ${isDarkMode ? 'bg-dark-secondary border-[#171717]' : 'bg-white border-gray-200'}`}>
              <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-[#171717]' : 'border-gray-200'}`}>
                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Alex Johnson</p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>alex@company.com</p>
              </div>
              
              <button className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                <FileText size={16} />
                <span className="text-sm font-medium">My Tasks</span>
              </button>
              
              <button className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                <User size={16} />
                <span className="text-sm font-medium">Profile Settings</span>
              </button>
              
              <button className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                <HelpCircle size={16} />
                <span className="text-sm font-medium">Help & Support</span>
              </button>
              
              <div className={`border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <button 
                  onClick={handleLogout}
                  className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-red-400' : 'hover:bg-gray-100 text-red-600'}`}
                >
                  <LogOut size={16} />
                  <span className="text-sm font-medium">Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
