import React, { useState } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { 
  getTeam, 
  getTeamProjects, 
  getTeamStats, 
  getTeamMembers,
  updateTeam,
  deleteTeam,
  createProject,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
  searchUsers,
  createInvitation
} from './services/projectApi';
import { useDebounce } from './hooks/useDebounce';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Plus,
  Users,
  Search,
  X,
  Edit3,
  Trash2,
  Settings,
  Calendar,
  Loader2,
  UserCheck,
  Mail
} from 'lucide-react';

/**
 * VALIDATION SCHEMAS (Client-Side with Zod)
 */

// Team validation
const teamSchema = z.object({
  name: z.string()
    .min(1, 'Team name is required')
    .max(100, 'Team name must be 100 characters or less')
    .trim(),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .or(z.literal(''))
});

// Project validation - STRICT with Security & Type Safety
const projectSchema = z.object({
  name: z.string()
    .trim() // Sanitization: remove whitespace
    .min(1, 'Project name is required')
    .max(100, 'Project name must be 100 characters or less'),
  description: z.string()
    .trim() // Sanitization
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .or(z.literal('')),
  status: z.enum(['active', 'archived', 'completed'], {
    errorMap: () => ({ message: 'Invalid status' })
  }),
  start_date: z.string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => {
        if (!val || val === '') return true;
        const date = new Date(val);
        return !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100;
      },
      { message: 'Invalid start date' }
    ),
  end_date: z.string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => {
        if (!val || val === '') return true;
        const date = new Date(val);
        return !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100;
      },
      { message: 'Invalid end date' }
    )
}).refine(
  (data) => {
    // CRITICAL: Date comparison validation
    if (data.start_date && data.end_date && data.start_date !== '' && data.end_date !== '') {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      // Type safety check
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return true;
      // end_date must be >= start_date
      return end >= start;
    }
    return true;
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['end_date'] // Associate error with end_date field
  }
);

// Invite member validation
const inviteMemberSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  role: z.enum(['member', 'admin'], {
    errorMap: () => ({ message: 'Invalid role' })
  })
});

/**
 * COMPONENTS
 */

// Modal wrapper component
const Modal = ({ isOpen, onClose, title, children, darkMode }) => {
  if (!isOpen) return null;

  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-lg rounded-xl shadow-2xl my-8 ${
          darkMode ? 'bg-[rgb(30,36,30)] border border-[rgb(45,52,45)]' : 'bg-white border border-[rgb(210,220,182)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`sticky top-0 z-10 ${
          darkMode ? 'bg-[rgb(30,36,30)]' : 'bg-white'
        }`}>
          <div className={`flex items-center justify-between p-6 border-b ${
            darkMode ? 'border-[rgb(45,52,45)]' : 'border-[rgb(210,220,182)]'
          }`}>
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-[rgb(45,52,45)] text-[rgb(161,188,152)]' : 'hover:bg-[rgb(210,220,182)]/50 text-[rgb(119,136,115)]'
              }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// Edit Team Modal
const EditTeamModal = ({ isOpen, onClose, team, onSubmit, darkMode }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (team) {
      setFormData({
        name: team.name || '',
        description: team.description || ''
      });
    }
    setError(null);
    setFieldErrors({});
  }, [team, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    // CLIENT-SIDE VALIDATION with Zod
    try {
      teamSchema.parse(formData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors = {};
        err.errors.forEach((error) => {
          errors[error.path[0]] = error.message;
        });
        setFieldErrors(errors);
        setError('Please fix the errors below');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await onSubmit(formData);
      
      // SUCCESS: Only close modal if no error thrown
      onClose();
    } catch (err) {
      // Extract server error message from response
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update team';
      console.error('❌ Server error:', errorMessage);
      setError(errorMessage);
      // Modal stays open, user can see the error and retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = `w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(119,136,115)]/50 transition-all ${
    darkMode ? 'bg-[rgb(24,28,24)] border border-[rgb(45,52,45)] text-white' : 'bg-white border border-[rgb(210,220,182)] text-[rgb(60,68,58)]'
  }`;
  
  const getInputClass = (fieldName) => {
    const hasError = fieldErrors[fieldName];
    return `w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${
      hasError 
        ? 'border-2 border-red-500 focus:ring-red-500/50 bg-red-50 dark:bg-red-500/10' 
        : darkMode 
          ? 'bg-[rgb(24,28,24)] border border-[rgb(45,52,45)] text-white focus:ring-[rgb(119,136,115)]/50' 
          : 'bg-white border border-[rgb(210,220,182)] text-[rgb(60,68,58)] focus:ring-[rgb(119,136,115)]/50'
    }`;
  };

  const labelClass = `block text-sm font-bold mb-2 ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Team" darkMode={darkMode}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Team Name *</label>
          <input
            type="text"
            maxLength={100}
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (fieldErrors.name) {
                setFieldErrors({ ...fieldErrors, name: null });
              }
            }}
            className={getInputClass('name')}
            placeholder="Enter team name"
          />
          {fieldErrors.name && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            rows={4}
            maxLength={500}
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
              if (fieldErrors.description) {
                setFieldErrors({ ...fieldErrors, description: null });
              }
            }}
            className={getInputClass('description')}
            placeholder="Enter team description"
          />
          {fieldErrors.description && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {fieldErrors.description}
            </p>
          )}
        </div>

        {error && (
          <div className={`p-3 rounded-lg border ${
            darkMode ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              darkMode ? 'bg-[rgb(45,52,45)] text-[rgb(161,188,152)] hover:bg-[rgb(45,52,45)]/70' : 'bg-[rgb(210,220,182)]/50 text-[rgb(119,136,115)] hover:bg-[rgb(210,220,182)]'
            } disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-[rgb(119,136,115)] hover:bg-[rgb(161,188,152)] text-white rounded-lg font-semibold transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Delete Team Modal
const DeleteTeamModal = ({ isOpen, onClose, team, onConfirm, darkMode }) => {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  React.useEffect(() => {
    setConfirmText('');
    setError(null);
  }, [isOpen]);

  const handleDelete = async () => {
    if (confirmText !== team?.name) {
      setError('Team name does not match');
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete team');
    } finally {
      setIsDeleting(false);
    }
  };

  const inputClass = `w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all ${
    darkMode ? 'bg-[rgb(24,28,24)] border border-[rgb(45,52,45)] text-white' : 'bg-white border border-[rgb(210,220,182)] text-[rgb(60,68,58)]'
  }`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Team" darkMode={darkMode}>
      <div className="space-y-4">
        <div className={`p-4 rounded-lg border-2 ${
          darkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className={`font-bold text-sm mb-1 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                Warning: This action cannot be undone
              </h4>
              <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-500'}`}>
                Deleting this team will permanently remove:
              </p>
              <ul className={`text-xs mt-2 space-y-1 list-disc list-inside ${darkMode ? 'text-red-300' : 'text-red-500'}`}>
                <li>All projects in this team</li>
                <li>All tasks in those projects</li>
                <li>All team members</li>
                <li>All related data</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
            Type <span className="font-mono text-red-500">"{team?.name}"</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className={inputClass}
            placeholder={team?.name}
          />
        </div>

        {error && (
          <div className={`p-3 rounded-lg border ${
            darkMode ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              darkMode ? 'bg-[rgb(45,52,45)] text-[rgb(161,188,152)] hover:bg-[rgb(45,52,45)]/70' : 'bg-[rgb(210,220,182)]/50 text-[rgb(119,136,115)] hover:bg-[rgb(210,220,182)]'
            } disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || confirmText !== team?.name}
            className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete Team'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Invite Member Modal (GitHub-Style Search & Select)
const InviteMemberModal = ({ isOpen, onClose, teamId, darkMode }) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Debounce search query to avoid spamming API
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedUser(null);
      setSelectedRole('member');
    }
  }, [isOpen]);

  // Search users query (only when debounced query has value)
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['searchUsers', teamId, debouncedQuery],
    queryFn: () => searchUsers(teamId, debouncedQuery),
    enabled: debouncedQuery.length > 0 && isOpen,
    select: (response) => response.data,
  });

  // Create invitation mutation
  const inviteMutation = useMutation({
    mutationFn: ({ email, role }) => createInvitation(teamId, email, role),
    onSuccess: (data) => {
      toast.success(data.message || 'Invitation sent successfully!');
      queryClient.invalidateQueries(['teamMembers', teamId]);
      onClose();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send invitation';
      toast.error(errorMessage);
    },
  });

  const handleInvite = () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    inviteMutation.mutate(
      { email: selectedUser.email, role: selectedRole },
      { onSettled: () => setIsSubmitting(false) }
    );
  };

  // Get user avatar (initials fallback)
  const getUserAvatar = (user) => {
    if (user.avatar_url) {
      return (
        <img 
          src={user.avatar_url} 
          alt={user.username}
          className="w-8 h-8 rounded-full object-cover"
        />
      );
    }
    
    // Fallback to initials
    const initials = user.username
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
        darkMode ? 'bg-[rgb(119,136,115)] text-[rgb(24,28,24)]' : 'bg-[rgb(119,136,115)] text-white'
      }`}>
        {initials}
      </div>
    );
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'member':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            <UserCheck size={12} />
            Already a member
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock size={12} />
            Invitation pending
          </span>
        );
      default:
        return null;
    }
  };

  const labelClass = `block text-sm font-bold mb-2 ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Team Member" darkMode={darkMode}>
      <div className="space-y-4">
        {/* Search Input */}
        <div>
          <label className={labelClass}>
            Search by username or email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search users..."
              className={`w-full rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 transition-all ${
                darkMode 
                  ? 'bg-[rgb(24,28,24)] border border-[rgb(45,52,45)] text-white focus:ring-[rgb(119,136,115)]/50' 
                  : 'bg-white border border-[rgb(210,220,182)] text-[rgb(60,68,58)] focus:ring-[rgb(119,136,115)]/50'
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isSearching ? (
                <Loader2 size={16} className="animate-spin text-[rgb(119,136,115)]" />
              ) : (
                <Search size={16} className="text-[rgb(119,136,115)]" />
              )}
            </div>
          </div>
        </div>

        {/* Search Results */}
        {debouncedQuery.length > 0 && (
          <div className={`border rounded-lg max-h-60 overflow-y-auto ${
            darkMode ? 'border-[rgb(45,52,45)]' : 'border-[rgb(210,220,182)]'
          }`}>
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-[rgb(119,136,115)]" />
              </div>
            ) : searchResults?.length > 0 ? (
              <div className="divide-y divide-[rgb(45,52,45)]">
                {searchResults.map((user) => {
                  const isDisabled = user.status !== 'none';
                  const isSelected = selectedUser?.id === user.id;
                  
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => !isDisabled && setSelectedUser(user)}
                      disabled={isDisabled}
                      className={`w-full p-3 flex items-center gap-3 transition-all text-left ${
                        isDisabled 
                          ? 'opacity-50 cursor-not-allowed' 
                          : isSelected
                            ? darkMode 
                              ? 'bg-[rgb(119,136,115)]/20' 
                              : 'bg-[rgb(161,188,152)]/20'
                            : darkMode
                              ? 'hover:bg-[rgb(45,52,45)]'
                              : 'hover:bg-[rgb(210,220,182)]/30'
                      }`}
                    >
                      {getUserAvatar(user)}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>
                          {user.username}
                        </p>
                        <p className={`text-xs truncate ${darkMode ? 'text-[rgb(119,136,115)]' : 'text-[rgb(119,136,115)]'}`}>
                          {user.email}
                        </p>
                      </div>
                      {getStatusBadge(user.status)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className={`text-sm ${darkMode ? 'text-[rgb(119,136,115)]' : 'text-[rgb(119,136,115)]'}`}>
                  No users found matching "{debouncedQuery}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Selected User Display */}
        {selectedUser && (
          <div className={`p-3 rounded-lg border ${
            darkMode 
              ? 'bg-[rgb(119,136,115)]/10 border-[rgb(119,136,115)]/30' 
              : 'bg-[rgb(161,188,152)]/10 border-[rgb(161,188,152)]/30'
          }`}>
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-[rgb(119,136,115)]" />
              <div className="flex-1">
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>
                  {selectedUser.username}
                </p>
                <p className={`text-xs ${darkMode ? 'text-[rgb(119,136,115)]' : 'text-[rgb(119,136,115)]'}`}>
                  {selectedUser.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded hover:bg-red-500/20 text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Role Selection */}
        {selectedUser && (
          <div>
            <label className={labelClass}>Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className={`w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                darkMode 
                  ? 'bg-[rgb(24,28,24)] border border-[rgb(45,52,45)] text-white focus:ring-[rgb(119,136,115)]/50' 
                  : 'bg-white border border-[rgb(210,220,182)] text-[rgb(60,68,58)] focus:ring-[rgb(119,136,115)]/50'
              }`}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <p className={`text-xs mt-1 ${darkMode ? 'text-[rgb(119,136,115)]' : 'text-[rgb(119,136,115)]'}`}>
              {selectedRole === 'admin' ? 'Can manage team settings and members' : 'Can view and work on projects'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              darkMode ? 'bg-[rgb(45,52,45)] text-[rgb(161,188,152)] hover:bg-[rgb(45,52,45)]/70' : 'bg-[rgb(210,220,182)]/50 text-[rgb(119,136,115)] hover:bg-[rgb(210,220,182)]'
            } disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInvite}
            disabled={!selectedUser || isSubmitting}
            className="flex-1 px-6 py-3 bg-[rgb(119,136,115)] hover:bg-[rgb(119,136,115)]/90 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sending...
              </>
            ) : (
              'Send Invitation'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Pending Invitations List Component
const PendingInvitationsList = ({ invitations, onRevoke, darkMode }) => {
  if (!invitations || invitations.length === 0) {
    return null;
  }

  return (
    <div className={`${
      darkMode ? 'bg-[rgb(30,36,30)]/50 border-[rgb(45,52,45)]/50' : 'bg-white border-[rgb(210,220,182)] shadow-sm'
    } border rounded-xl p-5 transition-all mb-6`}>
      <h3 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>
        Pending Invitations ({invitations.length})
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`border-b ${
              darkMode ? 'border-[rgb(45,52,45)]' : 'border-[rgb(210,220,182)]'
            }`}>
              <th className={`text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider ${
                darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'
              }`}>Email</th>
              <th className={`text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider ${
                darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'
              }`}>Role</th>
              <th className={`text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider ${
                darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'
              }`}>Sent Date</th>
              <th className={`text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider ${
                darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'
              }`}>Status</th>
              <th className={`text-right py-2 px-3 text-xs font-semibold uppercase tracking-wider ${
                darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'
              }`}>Action</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${
            darkMode ? 'divide-[rgb(45,52,45)]' : 'divide-[rgb(210,220,182)]'
          }`}>
            {invitations.map((invite) => (
              <tr key={invite.id} className={`transition-colors ${
                darkMode ? 'hover:bg-[rgb(45,52,45)]/30' : 'hover:bg-[rgb(210,220,182)]/20'
              }`}>
                <td className={`py-3 px-3 text-sm ${
                  darkMode ? 'text-[rgb(210,220,182)]' : 'text-[rgb(60,68,58)]'
                }`}>
                  {invite.email}
                </td>
                <td className="py-3 px-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    invite.role === 'admin'
                      ? 'bg-purple-500/10 text-purple-500'
                      : 'bg-blue-500/10 text-blue-500'
                  }`}>
                    {invite.role}
                  </span>
                </td>
                <td className={`py-3 px-3 text-sm ${
                  darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'
                }`}>
                  {new Date(invite.sentDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </td>
                <td className="py-3 px-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    invite.status === 'pending'
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'bg-gray-500/10 text-gray-500'
                  }`}>
                    {invite.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={() => onRevoke(invite)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      darkMode 
                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' 
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Create Project Modal
const CreateProjectModal = ({ isOpen, onClose, teamId, teamMembers, onSubmit, darkMode }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    start_date: '',
    end_date: '',
    selectedMembers: [] // Array of {userId, role}
  });
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        description: '',
        status: 'active',
        start_date: '',
        end_date: '',
        selectedMembers: [] // Creator will be auto-added as lead on backend
      });
      setError(null);
      setFieldErrors({});
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset all error states
    setError(null);
    setFieldErrors({});

    // SECURITY: STRICT CLIENT-SIDE VALIDATION - BLOCK REQUEST IF INVALID
    try {
      const validatedData = projectSchema.parse({
        name: formData.name,
        description: formData.description,
        status: formData.status,
        start_date: formData.start_date,
        end_date: formData.end_date
      });
      
      // If validation passes, validatedData is now sanitized (trimmed strings, etc.)
      console.log('✅ Validation passed:', validatedData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Build field-specific error map
        const errors = {};
        err.errors.forEach((error) => {
          const fieldName = error.path[0];
          errors[fieldName] = error.message;
        });
        
        console.log('❌ Validation failed:', errors);
        
        // Set errors to trigger visual feedback
        setFieldErrors(errors);
        setError('Please fix the errors below');
        
        // CRITICAL: DO NOT PROCEED - Block API call
        return; // Exit immediately without calling mutation
      }
    }

    // Validation passed - proceed with API call
    setIsSubmitting(true);

    try {
      const dataToSubmit = {
        name: formData.name.trim(),
        status: formData.status
      };
      
      if (formData.description?.trim()) {
        dataToSubmit.description = formData.description.trim();
      }
      
      if (formData.start_date) {
        dataToSubmit.start_date = new Date(formData.start_date).toISOString();
      }
      
      if (formData.end_date) {
        dataToSubmit.end_date = new Date(formData.end_date).toISOString();
      }

      // Pass selected members separately
      dataToSubmit.members = formData.selectedMembers;

      await onSubmit(dataToSubmit);
      
      // SUCCESS: Only close modal if no error thrown
      onClose();
    } catch (err) {
      // Extract server error message from response
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create project';
      console.error('❌ Server error:', errorMessage);
      setError(errorMessage);
      // Modal stays open, user can see the error and retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMember = (member) => {
    setFormData(prev => {
      const exists = prev.selectedMembers.find(m => m.userId === member.user_id);
      if (exists) {
        return {
          ...prev,
          selectedMembers: prev.selectedMembers.filter(m => m.userId !== member.user_id)
        };
      } else {
        return {
          ...prev,
          selectedMembers: [...prev.selectedMembers, { userId: member.user_id, role: 'viewer' }]
        };
      }
    });
  };

  const updateMemberRole = (userId, newRole) => {
    setFormData(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.map(m => 
        m.userId === userId ? { ...m, role: newRole } : m
      )
    }));
  };

  const getInputClass = (fieldName) => {
    const hasError = fieldErrors[fieldName];
    return `w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${
      hasError 
        ? 'border-2 border-red-500 focus:ring-red-500/50 bg-red-50 dark:bg-red-500/10' 
        : darkMode 
          ? 'bg-[rgb(24,28,24)] border border-[rgb(45,52,45)] text-white placeholder-[rgb(119,136,115)] focus:ring-[rgb(119,136,115)]/50' 
          : 'bg-white border border-[rgb(210,220,182)] text-[rgb(60,68,58)] placeholder-[rgb(119,136,115)] focus:ring-[rgb(119,136,115)]/50'
    }`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project" darkMode={darkMode}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              setFormData({...formData, name: e.target.value});
              if (fieldErrors.name) setFieldErrors({...fieldErrors, name: null});
            }}
            className={getInputClass('name')}
            placeholder="Enter project name"
            maxLength={100}
          />
          {fieldErrors.name ? (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {fieldErrors.name}
            </p>
          ) : (
            <p className={`text-xs mt-1 ${darkMode ? 'text-[rgb(119,136,115)]' : 'text-[rgb(119,136,115)]'}`}>
              {formData.name.length}/100 characters
            </p>
          )}
        </div>

        <div>
          <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => {
              setFormData({...formData, description: e.target.value});
              if (fieldErrors.description) setFieldErrors({...fieldErrors, description: null});
            }}
            className={getInputClass('description')}
            placeholder="Project description (optional)"
            rows={3}
            maxLength={500}
          />
          {fieldErrors.description ? (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {fieldErrors.description}
            </p>
          ) : (
            <p className={`text-xs mt-1 ${darkMode ? 'text-[rgb(119,136,115)]' : 'text-[rgb(119,136,115)]'}`}>
              {formData.description.length}/500 characters
            </p>
          )}
        </div>

        <div>
          <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => {
              setFormData({...formData, status: e.target.value});
              if (fieldErrors.status) setFieldErrors({...fieldErrors, status: null});
            }}
            className={getInputClass('status')}
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="completed">Completed</option>
          </select>
          {fieldErrors.status && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {fieldErrors.status}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
              Start Date
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => {
                setFormData({...formData, start_date: e.target.value});
                if (fieldErrors.start_date) setFieldErrors({...fieldErrors, start_date: null});
              }}
              className={getInputClass('start_date')}
            />
            {fieldErrors.start_date && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {fieldErrors.start_date}
              </p>
            )}
          </div>
          <div>
            <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
              End Date
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => {
                setFormData({...formData, end_date: e.target.value});
                if (fieldErrors.end_date) setFieldErrors({...fieldErrors, end_date: null});
              }}
              onBlur={() => {
                // Validate date comparison on blur for CreateProjectModal
                if (formData.start_date && formData.end_date) {
                  const start = new Date(formData.start_date);
                  const end = new Date(formData.end_date);
                  if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
                    setFieldErrors(prev => ({...prev, end_date: 'End date must be after start date'}));
                  }
                }
              }}
              className={getInputClass('end_date')}
            />
            {fieldErrors.end_date && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {fieldErrors.end_date}
              </p>
            )}
          </div>
        </div>

        {/* Member Selection */}
        <div>
          <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
            Team Members <span className="text-xs font-normal">(You will be added as lead automatically)</span>
          </label>
          <div className={`max-h-48 overflow-y-auto rounded-lg border ${
            darkMode ? 'border-[rgb(45,52,45)] bg-[rgb(24,28,24)]' : 'border-[rgb(210,220,182)] bg-white'
          }`}>
            {teamMembers && teamMembers.length > 0 ? (
              <div className="divide-y divide-[rgb(45,52,45)]">
                {teamMembers.map((member) => {
                  const isSelected = formData.selectedMembers.find(m => m.userId === member.user_id);
                  return (
                    <div key={member.user_id} className={`p-3 flex items-center justify-between hover:bg-[rgb(45,52,45)]/30 transition-colors`}>
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={() => toggleMember(member)}
                          className="w-4 h-4 rounded border-[rgb(119,136,115)] text-[rgb(119,136,115)] focus:ring-[rgb(119,136,115)]"
                        />
                        <div className="flex items-center gap-2">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.username} className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              darkMode ? 'bg-[rgb(119,136,115)] text-white' : 'bg-[rgb(210,220,182)] text-[rgb(60,68,58)]'
                            }`}>
                              {member.username[0].toUpperCase()}
                            </div>
                          )}
                          <span className={`text-sm ${darkMode ? 'text-[rgb(241,243,224)]' : 'text-[rgb(60,68,58)]'}`}>
                            {member.username}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            darkMode ? 'bg-[rgb(45,52,45)] text-[rgb(161,188,152)]' : 'bg-[rgb(210,220,182)]/50 text-[rgb(119,136,115)]'
                          }`}>
                            {member.role}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <select
                          value={isSelected.role}
                          onChange={(e) => updateMemberRole(member.user_id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded border focus:outline-none focus:ring-1 focus:ring-[rgb(119,136,115)] ${
                            darkMode ? 'bg-[rgb(30,36,30)] border-[rgb(45,52,45)] text-[rgb(161,188,152)]' : 'bg-white border-[rgb(210,220,182)] text-[rgb(119,136,115)]'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="lead">Lead</option>
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`p-4 text-center text-sm ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
                No team members available
              </div>
            )}
          </div>
          <p className={`text-xs mt-1 ${darkMode ? 'text-[rgb(119,136,115)]' : 'text-[rgb(119,136,115)]'}`}>
            {formData.selectedMembers.length} member(s) selected (+ you as lead)
          </p>
        </div>

        {error && (
          <div className={`p-3 rounded-lg border ${
            darkMode ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              darkMode ? 'bg-[rgb(45,52,45)] text-[rgb(161,188,152)] hover:bg-[rgb(45,52,45)]/70' : 'bg-[rgb(210,220,182)]/50 text-[rgb(119,136,115)] hover:bg-[rgb(210,220,182)]'
            } disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formData.name.trim()}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              darkMode ? 'bg-[rgb(119,136,115)] hover:bg-[rgb(119,136,115)]/80 text-white' : 'bg-[rgb(119,136,115)] hover:bg-[rgb(119,136,115)]/90 text-white'
            }`}
          >
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Remove Member Confirmation Modal
const RemoveMemberConfirmModal = ({ isOpen, onClose, memberInfo, onConfirm, darkMode }) => {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setError(null);
    }
  }, [isOpen]);

  const handleRemove = async () => {
    if (confirmText.toLowerCase() !== 'yes') {
      setError('Please type "Yes" to confirm');
      return;
    }

    setError(null);
    setIsRemoving(true);

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to remove member');
    } finally {
      setIsRemoving(false);
    }
  };

  const inputClass = `w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all ${
    darkMode ? 'bg-[rgb(24,28,24)] border border-[rgb(45,52,45)] text-white' : 'bg-white border border-[rgb(210,220,182)] text-[rgb(60,68,58)]'
  }`;

  return (
    <div className={`${isOpen ? 'fixed' : 'hidden'} inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto`}>
      <div 
        className={`w-full max-w-lg rounded-xl shadow-2xl my-8 ${
          darkMode ? 'bg-[rgb(30,36,30)] border border-[rgb(45,52,45)]' : 'bg-white border border-[rgb(210,220,182)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between p-6 border-b ${
          darkMode ? 'border-[rgb(45,52,45)] bg-[rgb(30,36,30)]' : 'border-[rgb(210,220,182)] bg-white'
        }`}>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>
            Remove Project Member
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-[rgb(45,52,45)] text-[rgb(161,188,152)]' : 'hover:bg-[rgb(210,220,182)]/50 text-[rgb(119,136,115)]'
            }`}
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
      <div className="space-y-4">
        <div className={`p-4 rounded-lg border-2 ${
          darkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className={`font-bold text-sm mb-1 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                Warning: This action cannot be undone
              </h4>
              <p className={`text-sm mb-2 ${darkMode ? 'text-red-300' : 'text-red-500'}`}>
                This member has <span className="font-bold">{memberInfo?.taskCount || 0} assigned task(s)</span>.
              </p>
              <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-500'}`}>
                Removing this member will:
              </p>
              <ul className={`text-xs mt-2 space-y-1 list-disc list-inside ${darkMode ? 'text-red-300' : 'text-red-500'}`}>
                <li>Unassign them from all {memberInfo?.taskCount || 0} task(s)</li>
                <li>Remove their access to this project</li>
                <li>Remove them from project channels</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
            Type <span className="font-mono text-red-500">"Yes"</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className={inputClass}
            placeholder="Yes"
          />
        </div>

        {error && (
          <div className={`p-3 rounded-lg border ${
            darkMode ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isRemoving}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              darkMode ? 'bg-[rgb(45,52,45)] text-[rgb(161,188,152)] hover:bg-[rgb(45,52,45)]/70' : 'bg-[rgb(210,220,182)]/50 text-[rgb(119,136,115)] hover:bg-[rgb(210,220,182)]'
            } disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={isRemoving || confirmText.toLowerCase() !== 'yes'}
            className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRemoving ? 'Removing...' : 'Remove Member'}
          </button>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

// Edit Project Modal
const EditProjectModal = ({ isOpen, onClose, project, onSubmit, darkMode, teamMembers, teamId, queryClient }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    start_date: '',
    end_date: '',
    selectedMembers: [] // {userId, role}
  });
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialMembers, setInitialMembers] = useState([]); // Track initial state for comparison
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null); // {userId, taskCount}
  const [pendingChanges, setPendingChanges] = useState(null); // Store changes to apply after confirmation

  // Fetch current project members when modal opens
  React.useEffect(() => {
    if (project && isOpen) {
      const fetchProjectMembers = async () => {
        try {
          const response = await getProjectMembers(project.id);
          const members = response.data.map(m => ({ userId: m.user_id, role: m.role }));
          setInitialMembers(members);
          
          setFormData({
            name: project.name || '',
            description: project.description || '',
            status: project.status || 'active',
            start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
            end_date: project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : '',
            selectedMembers: members
          });
          setError(null);
        } catch (err) {
          console.error('Failed to fetch project members:', err);
          setError('Failed to load project members');
        }
      };
      
      fetchProjectMembers();
    }
  }, [project, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset all error states
    setError(null);
    setFieldErrors({});

    // SECURITY: STRICT CLIENT-SIDE VALIDATION - BLOCK REQUEST IF INVALID
    try {
      const validatedData = projectSchema.parse({
        name: formData.name,
        description: formData.description,
        status: formData.status,
        start_date: formData.start_date,
        end_date: formData.end_date
      });
      
      console.log('✅ EditProject validation passed:', validatedData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Build field-specific error map
        const errors = {};
        err.errors.forEach((error) => {
          const fieldName = error.path[0];
          errors[fieldName] = error.message;
        });
        
        console.log('❌ EditProject validation failed:', errors);
        
        // Set errors to trigger visual feedback
        setFieldErrors(errors);
        setError('Please fix the errors below');
        
        // CRITICAL: DO NOT PROCEED - Block API call
        return; // Exit immediately without calling mutation
      }
    }

    // Validation passed - proceed with updates
    setIsSubmitting(true);

    try {
      // Handle project detail updates
      const dataToSubmit = {};
      
      if (formData.name.trim() !== project.name) {
        dataToSubmit.name = formData.name.trim();
      }
      
      if (formData.description?.trim() !== project.description) {
        dataToSubmit.description = formData.description.trim();
      }
      
      if (formData.status !== project.status) {
        dataToSubmit.status = formData.status;
      }

      const projectStartDate = project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '';
      if (formData.start_date !== projectStartDate) {
        dataToSubmit.start_date = formData.start_date ? new Date(formData.start_date).toISOString() : null;
      }

      const projectEndDate = project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : '';
      if (formData.end_date !== projectEndDate) {
        dataToSubmit.end_date = formData.end_date ? new Date(formData.end_date).toISOString() : null;
      }

      // Update project if there are changes
      if (Object.keys(dataToSubmit).length > 0) {
        try {
          await onSubmit(dataToSubmit);
        } catch (err) {
          // Extract server error message from response
          const errorMessage = err.response?.data?.message || err.message || 'Failed to update project';
          console.error('❌ Server error:', errorMessage);
          setError(errorMessage);
          setIsSubmitting(false);
          return; // Exit early, modal stays open
        }
      }

      // Handle member changes
      const currentMemberIds = initialMembers.map(m => m.userId);
      const selectedMemberIds = formData.selectedMembers.map(m => m.userId);

      // Members to add (in selected but not in current)
      const membersToAdd = formData.selectedMembers.filter(m => !currentMemberIds.includes(m.userId));

      // Members to remove (in current but not in selected)
      const membersToRemove = initialMembers.filter(m => !selectedMemberIds.includes(m.userId));

      // Members to update role (in both but role changed)
      const membersToUpdate = formData.selectedMembers.filter(m => {
        const initial = initialMembers.find(im => im.userId === m.userId);
        return initial && initial.role !== m.role;
      });

      // Execute member operations
      for (const member of membersToAdd) {
        try {
          await addProjectMember(project.id, member.userId, member.role);
        } catch (err) {
          const errorMessage = err.response?.data?.message || err.message || 'Failed to add member';
          console.error(`Failed to add member ${member.userId}:`, errorMessage);
          setError(`Failed to add member: ${errorMessage}`);
          setIsSubmitting(false);
          return; // Exit early, modal stays open
        }
      }

      for (const member of membersToRemove) {
        try {
          // Try to remove without force first
          await removeProjectMember(project.id, member.userId, false);
        } catch (err) {
          // Extract error message properly
          const errorMessage = err.response?.data?.message || err.message || 'Failed to remove member';
          
          // If member has tasks, show confirmation modal
          console.log('Remove member error:', errorMessage); // Debug log
          if (errorMessage.includes('assigned task')) {
            // Extract task count from error message
            const taskCountMatch = errorMessage.match(/(\d+)/);
            const taskCount = taskCountMatch ? parseInt(taskCountMatch[0]) : 0;
            
            // Store pending changes and show modal
            setPendingChanges({ dataToSubmit, membersToAdd, membersToRemove, membersToUpdate });
            setMemberToRemove({ userId: member.userId, taskCount });
            setShowRemoveMemberModal(true);
            setIsSubmitting(false);
            return; // Stop execution, wait for user confirmation
          } else {
            // Other errors - display and stop
            setError(`Failed to remove member: ${errorMessage}`);
            setIsSubmitting(false);
            return; // Exit early, modal stays open
          }
        }
      }

      for (const member of membersToUpdate) {
        try {
          await updateProjectMemberRole(project.id, member.userId, member.role);
        } catch (err) {
          console.error(`Failed to update member ${member.userId}:`, err);
          throw new Error(`Failed to update member role: ${err.message}`);
        }
      }

      // If no project changes and no member changes, show error
      if (Object.keys(dataToSubmit).length === 0 && 
          membersToAdd.length === 0 && 
          membersToRemove.length === 0 && 
          membersToUpdate.length === 0) {
        setError('No changes detected');
        setIsSubmitting(false);
        return;
      }

      // Invalidate queries to refresh data
      if (queryClient) {
        queryClient.invalidateQueries(['teamProjects', teamId]);
        queryClient.invalidateQueries(['teamStats', teamId]);
      }

      // SUCCESS: Only close modal if all operations succeeded
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMember = (member) => {
    setFormData(prev => {
      const exists = prev.selectedMembers.find(m => m.userId === member.user_id);
      if (exists) {
        return {
          ...prev,
          selectedMembers: prev.selectedMembers.filter(m => m.userId !== member.user_id)
        };
      } else {
        return {
          ...prev,
          selectedMembers: [...prev.selectedMembers, { userId: member.user_id, role: 'viewer' }]
        };
      }
    });
  };

  const updateMemberRole = (userId, newRole) => {
    setFormData(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.map(m => 
        m.userId === userId ? { ...m, role: newRole } : m
      )
    }));
  };

  // Handle confirmed member removal with force
  const handleConfirmedRemoval = async () => {
    if (!memberToRemove || !pendingChanges) return;

    setIsSubmitting(true);
    setShowRemoveMemberModal(false);

    try {
      const { dataToSubmit, membersToAdd, membersToRemove, membersToUpdate } = pendingChanges;

      // Execute member additions first
      for (const member of membersToAdd) {
        try {
          await addProjectMember(project.id, member.userId, member.role);
        } catch (err) {
          console.error(`Failed to add member ${member.userId}:`, err);
          throw new Error(`Failed to add member: ${err.message}`);
        }
      }

      // Execute member removals (including the one with tasks using force)
      for (const member of membersToRemove) {
        try {
          const forceRemove = member.userId === memberToRemove.userId;
          await removeProjectMember(project.id, member.userId, forceRemove);
        } catch (err) {
          throw new Error(`Failed to remove member: ${err.message}`);
        }
      }

      // Execute role updates
      for (const member of membersToUpdate) {
        try {
          await updateProjectMemberRole(project.id, member.userId, member.role);
        } catch (err) {
          console.error(`Failed to update member ${member.userId}:`, err);
          throw new Error(`Failed to update member role: ${err.message}`);
        }
      }

      // Invalidate queries to refresh data
      if (queryClient) {
        queryClient.invalidateQueries(['teamProjects', teamId]);
        queryClient.invalidateQueries(['teamStats', teamId]);
      }

      // Clear pending changes and close
      setPendingChanges(null);
      setMemberToRemove(null);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputClass = (fieldName) => {
    const hasError = fieldErrors[fieldName];
    return `w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${
      hasError 
        ? 'border-2 border-red-500 focus:ring-red-500/50 bg-red-50 dark:bg-red-500/10' 
        : darkMode 
          ? 'bg-[rgb(24,28,24)] border border-[rgb(45,52,45)] text-white placeholder-[rgb(119,136,115)] focus:ring-[rgb(119,136,115)]/50' 
          : 'bg-white border border-[rgb(210,220,182)] text-[rgb(60,68,58)] placeholder-[rgb(119,136,115)] focus:ring-[rgb(119,136,115)]/50'
    }`;
  };

  return (
    <>
      <RemoveMemberConfirmModal
        isOpen={showRemoveMemberModal}
        onClose={() => {
          setShowRemoveMemberModal(false);
          setMemberToRemove(null);
          setPendingChanges(null);
          setIsSubmitting(false);
        }}
        memberInfo={memberToRemove}
        onConfirm={handleConfirmedRemoval}
        darkMode={darkMode}
      />
      
      <Modal isOpen={isOpen} onClose={onClose} title="Edit Project" darkMode={darkMode}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              setFormData({...formData, name: e.target.value});
              if (fieldErrors.name) setFieldErrors({...fieldErrors, name: null});
            }}
            className={getInputClass('name')}
            placeholder="Enter project name"
            maxLength={100}
          />
          {fieldErrors.name ? (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {fieldErrors.name}
            </p>
          ) : (
            <p className={`text-xs mt-1 ${darkMode ? 'text-[rgb(119,136,115)]' : 'text-[rgb(119,136,115)]'}`}>
              {formData.name.length}/100 characters
            </p>
          )}
        </div>

        <div>
          <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => {
              setFormData({...formData, description: e.target.value});
              if (fieldErrors.description) setFieldErrors({...fieldErrors, description: null});
            }}
            className={getInputClass('description')}
            placeholder="Project description (optional)"
            rows={3}
            maxLength={500}
          />
          {fieldErrors.description ? (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {fieldErrors.description}
            </p>
          ) : (
            <p className={`text-xs mt-1 ${darkMode ? 'text-[rgb(119,136,115)]' : 'text-[rgb(119,136,115)]'}`}>
              {formData.description.length}/500 characters
            </p>
          )}
        </div>

        <div>
          <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => {
              setFormData({...formData, status: e.target.value});
              if (fieldErrors.status) setFieldErrors({...fieldErrors, status: null});
            }}
            className={getInputClass('status')}
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="completed">Completed</option>
          </select>
          {fieldErrors.status && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {fieldErrors.status}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
              Start Date
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => {
                setFormData({...formData, start_date: e.target.value});
                if (fieldErrors.start_date) setFieldErrors({...fieldErrors, start_date: null});
              }}
              className={getInputClass('start_date')}
            />
            {fieldErrors.start_date && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {fieldErrors.start_date}
              </p>
            )}
          </div>
          <div>
            <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
              End Date
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => {
                setFormData({...formData, end_date: e.target.value});
                if (fieldErrors.end_date) setFieldErrors({...fieldErrors, end_date: null});
              }}
              onBlur={() => {
                // Validate date comparison on blur for EditProjectModal
                if (formData.start_date && formData.end_date) {
                  const start = new Date(formData.start_date);
                  const end = new Date(formData.end_date);
                  if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
                    setFieldErrors(prev => ({...prev, end_date: 'End date must be after start date'}));
                  }
                }
              }}
              className={getInputClass('end_date')}
            />
            {fieldErrors.end_date && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {fieldErrors.end_date}
              </p>
            )}
          </div>
        </div>

        {/* Member Selection */}
        <div>
          <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
            Project Members
          </label>
          <div className={`max-h-48 overflow-y-auto rounded-lg border ${
            darkMode ? 'border-[rgb(45,52,45)] bg-[rgb(24,28,24)]' : 'border-[rgb(210,220,182)] bg-white'
          }`}>
            {teamMembers && teamMembers.length > 0 ? (
              <div className="divide-y divide-[rgb(45,52,45)]">
                {teamMembers.map((member) => {
                  const isSelected = formData.selectedMembers.find(m => m.userId === member.user_id);
                  return (
                    <div key={member.user_id} className={`p-3 flex items-center justify-between hover:bg-[rgb(45,52,45)]/30 transition-colors`}>
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={() => toggleMember(member)}
                          className="w-4 h-4 rounded border-[rgb(119,136,115)] text-[rgb(119,136,115)] focus:ring-[rgb(119,136,115)]"
                        />
                        <div className="flex items-center gap-2">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.username} className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              darkMode ? 'bg-[rgb(119,136,115)] text-white' : 'bg-[rgb(210,220,182)] text-[rgb(60,68,58)]'
                            }`}>
                              {member.username[0].toUpperCase()}
                            </div>
                          )}
                          <span className={`text-sm ${darkMode ? 'text-[rgb(241,243,224)]' : 'text-[rgb(60,68,58)]'}`}>
                            {member.username}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            darkMode ? 'bg-[rgb(45,52,45)] text-[rgb(161,188,152)]' : 'bg-[rgb(210,220,182)]/50 text-[rgb(119,136,115)]'
                          }`}>
                            {member.role}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <select
                          value={isSelected.role}
                          onChange={(e) => updateMemberRole(member.user_id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded border focus:outline-none focus:ring-1 focus:ring-[rgb(119,136,115)] ${
                            darkMode ? 'bg-[rgb(30,36,30)] border-[rgb(45,52,45)] text-[rgb(161,188,152)]' : 'bg-white border-[rgb(210,220,182)] text-[rgb(119,136,115)]'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="lead">Lead</option>
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`p-4 text-center text-sm ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
                No team members available
              </div>
            )}
          </div>
          <p className={`text-xs mt-1 ${darkMode ? 'text-[rgb(119,136,115)]' : 'text-[rgb(119,136,115)]'}`}>
            {formData.selectedMembers.length} member(s) selected
          </p>
        </div>

        {error && (
          <div className={`p-3 rounded-lg border ${
            darkMode ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              darkMode ? 'bg-[rgb(45,52,45)] text-[rgb(161,188,152)] hover:bg-[rgb(45,52,45)]/70' : 'bg-[rgb(210,220,182)]/50 text-[rgb(119,136,115)] hover:bg-[rgb(210,220,182)]'
            } disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formData.name.trim()}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              darkMode ? 'bg-[rgb(119,136,115)] hover:bg-[rgb(119,136,115)]/80 text-white' : 'bg-[rgb(119,136,115)] hover:bg-[rgb(119,136,115)]/90 text-white'
            }`}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
    </>
  );
};

// Delete Project Modal
const DeleteProjectModal = ({ isOpen, onClose, project, onConfirm, darkMode }) => {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setError(null);
    }
  }, [isOpen]);

  const handleDelete = async () => {
    if (confirmText !== project?.name) {
      setError('Project name does not match');
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  const inputClass = `w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all ${
    darkMode ? 'bg-[rgb(24,28,24)] border border-[rgb(45,52,45)] text-white' : 'bg-white border border-[rgb(210,220,182)] text-[rgb(60,68,58)]'
  }`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Project" darkMode={darkMode}>
      <div className="space-y-4">
        <div className={`p-4 rounded-lg border-2 ${
          darkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className={`font-bold text-sm mb-1 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                Warning: This action cannot be undone
              </h4>
              <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-500'}`}>
                Deleting this project will permanently remove:
              </p>
              <ul className={`text-xs mt-2 space-y-1 list-disc list-inside ${darkMode ? 'text-red-300' : 'text-red-500'}`}>
                <li>All tasks in this project</li>
                <li>All project members</li>
                <li>All related channels</li>
                <li>All related data</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
            Type <span className="font-mono text-red-500">"{project?.name}"</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className={inputClass}
            placeholder={project?.name}
          />
        </div>

        {error && (
          <div className={`p-3 rounded-lg border ${
            darkMode ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              darkMode ? 'bg-[rgb(45,52,45)] text-[rgb(161,188,152)] hover:bg-[rgb(45,52,45)]/70' : 'bg-[rgb(210,220,182)]/50 text-[rgb(119,136,115)] hover:bg-[rgb(210,220,182)]'
            } disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || confirmText !== project?.name}
            className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete Project'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const FilterButton = ({ active, onClick, children, darkMode }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      active
        ? 'bg-[rgb(119,136,115)] text-white shadow-md'
        : darkMode
        ? 'bg-[rgb(45,52,45)] text-[rgb(161,188,152)] hover:bg-[rgb(45,52,45)]/70'
        : 'bg-[rgb(210,220,182)]/50 text-[rgb(119,136,115)] hover:bg-[rgb(210,220,182)]'
    }`}
  >
    {children}
  </button>
);

const ProjectCard = ({ project, darkMode, onClick, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = React.useRef(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  // Calculate progress percentage
  const progress = project.total_tasks > 0 
    ? Math.round((project.completed_tasks / project.total_tasks) * 100) 
    : 0;

  // Determine status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-500 bg-green-500/10';
      case 'completed': return 'text-blue-500 bg-blue-500/10';
      case 'archived': return 'text-gray-500 bg-gray-500/10';
      default: return 'text-purple-500 bg-purple-500/10';
    }
  };

  return (
    <div 
      className={`${darkMode ? 'bg-[rgb(30,36,30)]/50 border-[rgb(45,52,45)]/50' : 'bg-white border-[rgb(210,220,182)] shadow-sm'} border rounded-xl p-5 hover:border-[rgb(161,188,152)] transition-all flex flex-col h-full relative group`}
    >
      {/* Project card header with menu */}
      <div className="flex justify-between items-start mb-3">
        <h3 
          onClick={onClick}
          className={`font-semibold text-lg cursor-pointer hover:text-[rgb(119,136,115)] transition-colors ${darkMode ? 'text-[rgb(241,243,224)]' : 'text-[rgb(60,68,58)]'}`}
        >
          {project.name}
        </h3>
        
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
          
          {/* Actions menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                darkMode ? 'hover:bg-[rgb(45,52,45)] text-[rgb(161,188,152)]' : 'hover:bg-[rgb(210,220,182)]/50 text-[rgb(119,136,115)]'
              } ${showMenu ? 'opacity-100' : ''}`}
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <div 
                className={`absolute right-0 mt-2 w-40 rounded-lg shadow-lg border z-10 ${
                  darkMode ? 'bg-[rgb(30,36,30)] border-[rgb(45,52,45)]' : 'bg-white border-[rgb(210,220,182)]'
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit(project);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                    darkMode ? 'hover:bg-[rgb(45,52,45)] text-[rgb(161,188,152)]' : 'hover:bg-[rgb(210,220,182)]/50 text-[rgb(119,136,115)]'
                  }`}
                >
                  <Edit3 size={14} />
                  Edit Project
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete(project);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 transition-colors ${
                    darkMode ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                  }`}
                >
                  <Trash2 size={14} />
                  Delete Project
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <p 
        onClick={onClick}
        className={`${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'} text-sm mb-6 line-clamp-2 flex-grow cursor-pointer`}
      >
        {project.description || 'No description provided'}
      </p>

      <div onClick={onClick} className="mt-auto space-y-4 cursor-pointer">
        <div className="flex items-center gap-2">
          <Users size={14} className={darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'} />
          <span className={`text-xs ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
            {project.member_count} {project.member_count === 1 ? 'member' : 'members'}
          </span>
        </div>

        <div>
          <div className={`flex justify-between text-xs mb-1.5 ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
            <span>Progress</span>
            <span className={`font-medium ${darkMode ? 'text-[rgb(210,220,182)]' : 'text-[rgb(60,68,58)]'}`}>{progress}%</span>
          </div>
          <div className={`w-full rounded-full h-1.5 ${darkMode ? 'bg-[rgb(45,52,45)]' : 'bg-[rgb(210,220,182)]'}`}>
            <div 
              className="bg-[rgb(119,136,115)] h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className={`pt-3 border-t flex items-center justify-between text-xs ${darkMode ? 'border-[rgb(45,52,45)]/50 text-[rgb(161,188,152)]' : 'border-[rgb(210,220,182)] text-[rgb(119,136,115)]'}`}>
          <div className="flex items-center">
            <Clock size={14} className="mr-1.5" />
            <span>{project.completed_tasks}/{project.total_tasks} tasks</span>
          </div>
          {project.end_date && (
            <span className={`${darkMode ? 'text-[rgb(210,220,182)]' : 'text-[rgb(60,68,58)]'}`}>
              {new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * MAIN TEAM PAGE COMPONENT
 */
export default function TeamPage() {
  const { isDarkMode } = useOutletContext();
  const { teamId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
  const [showInviteMemberModal, setShowInviteMemberModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectMenuOpen, setProjectMenuOpen] = useState(null);

  // MOCK DATA: Pending invitations (replace with real API call later)
  const [mockPendingInvites] = useState([
    {
      id: 1,
      email: 'john.doe@example.com',
      role: 'member',
      sentDate: '2024-12-10T10:30:00Z',
      status: 'pending'
    },
    {
      id: 2,
      email: 'jane.smith@example.com',
      role: 'admin',
      sentDate: '2024-12-11T14:20:00Z',
      status: 'pending'
    },
    {
      id: 3,
      email: 'bob.wilson@example.com',
      role: 'member',
      sentDate: '2024-12-12T09:15:00Z',
      status: 'pending'
    }
  ]);

  // Handler for revoking invitations (mock for now)
  const handleRevokeInvite = (invite) => {
    console.log('🗑️ [MOCK] Revoking invitation:', invite);
    // TODO: Implement actual API call
    toast.success(`Invitation to ${invite.email} would be revoked`);
  };

  // Fetch team data
  const { data: teamData, isLoading: teamLoading, error: teamError } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => getTeam(teamId),
    enabled: !!teamId,
  });

  // Fetch team projects
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['teamProjects', teamId],
    queryFn: () => getTeamProjects(teamId),
    enabled: !!teamId,
  });

  // Fetch team stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['teamStats', teamId],
    queryFn: () => getTeamStats(teamId),
    enabled: !!teamId,
  });

  // Fetch team members
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['teamMembers', teamId],
    queryFn: () => getTeamMembers(teamId),
    enabled: !!teamId,
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: (updates) => updateTeam(teamId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['team', teamId]);
      queryClient.invalidateQueries(['teams']); // Refresh sidebar
    },
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: () => deleteTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']); // Refresh sidebar
      navigate('/teams/1'); // Navigate to first team (or could show "no teams" page)
    },
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData) => {
      const { members, ...projectInfo } = projectData;
      
      // Create the project first
      const result = await createProject(teamId, projectInfo);
      const newProjectId = result.data.id;
      
      // Add members to the project (creator is already added as lead on backend)
      if (members && members.length > 0) {
        await Promise.all(
          members.map(member => 
            addProjectMember(newProjectId, member.userId, member.role)
          )
        );
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['teamProjects', teamId]);
      queryClient.invalidateQueries(['teamStats', teamId]);
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: ({ projectId, updates }) => updateProject(teamId, projectId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['teamProjects', teamId]);
      queryClient.invalidateQueries(['teamStats', teamId]);
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: (projectId) => deleteProject(teamId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries(['teamProjects', teamId]);
      queryClient.invalidateQueries(['teamStats', teamId]);
    },
  });

  const cardBg = isDarkMode ? 'bg-[rgb(30,36,30)]/50 border-[rgb(45,52,45)]/50' : 'bg-white border-[rgb(210,220,182)] shadow-sm';

  // Handle loading state
  if (teamLoading || statsLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className={`${cardBg} border rounded-xl p-8 text-center`}>
            <div className={`inline-block animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-[rgb(119,136,115)]' : 'border-[rgb(119,136,115)]'}`}></div>
            <p className={`mt-4 ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>Loading team data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (teamError) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-red-500 font-bold text-xl mb-2">Error Loading Team</h2>
            <p className={`${isDarkMode ? 'text-red-200/70' : 'text-red-600/70'}`}>
              {teamError.message || 'Failed to load team data. You may not have access to this team.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const team = teamData?.data;
  const projects = projectsData?.data || [];
  const stats = statsData?.data || {};
  const members = membersData?.data || [];

  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => {
      // Search filter
      if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !project.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (statusFilter !== 'all' && project.status !== statusFilter) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'progress') {
        const progressA = a.total_tasks > 0 ? (a.completed_tasks / a.total_tasks) : 0;
        const progressB = b.total_tasks > 0 ? (b.completed_tasks / b.total_tasks) : 0;
        return progressB - progressA;
      }
      return 0;
    });

  // Build stats array for display
  const STATS = [
    { label: 'Total Projects', value: stats.total_projects || 0, icon: FolderKanban, color: 'bg-blue-500/10 text-blue-500' },
    { label: 'Active Projects', value: stats.active_projects || 0, icon: CheckCircle2, color: 'bg-green-500/10 text-green-500' },
    { label: 'Total Tasks', value: stats.total_tasks || 0, icon: LayoutDashboard, color: 'bg-amber-500/10 text-amber-500' },
    { label: 'Team Members', value: stats.total_members || 0, icon: Users, color: 'bg-purple-500/10 text-purple-500' },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* WELCOME */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>
              {team?.name || 'Team Dashboard'} 👋
            </h1>
            <p className={`${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
              {team?.description || "Here's what's happening with team projects today."}
            </p>
          </div>

          {/* Settings Menu */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className={`p-2.5 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-[rgb(45,52,45)] text-[rgb(161,188,152)]' : 'hover:bg-[rgb(210,220,182)]/50 text-[rgb(119,136,115)]'
              }`}
              title="Team Settings"
            >
              <Settings size={20} />
            </button>

            {showSettingsMenu && (
              <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border overflow-hidden z-10 ${
                isDarkMode ? 'bg-[rgb(30,36,30)] border-[rgb(45,52,45)]' : 'bg-white border-[rgb(210,220,182)]'
              }`}>
                <button
                  onClick={() => { setShowEditModal(true); setShowSettingsMenu(false); }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                    isDarkMode ? 'hover:bg-[rgb(45,52,45)] text-[rgb(210,220,182)]' : 'hover:bg-[rgb(210,220,182)]/30 text-[rgb(60,68,58)]'
                  }`}
                >
                  <Edit3 size={14} />
                  Edit Team
                </button>
                <button
                  onClick={() => { setShowDeleteModal(true); setShowSettingsMenu(false); }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                    isDarkMode ? 'hover:bg-[rgb(45,52,45)] text-red-400' : 'hover:bg-[rgb(210,220,182)]/30 text-red-600'
                  }`}
                >
                  <Trash2 size={14} />
                  Delete Team
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PENDING INVITATIONS */}
        <PendingInvitationsList
          invitations={mockPendingInvites}
          onRevoke={handleRevokeInvite}
          darkMode={isDarkMode}
        />

        {/* TOP ROW: TEAM MEMBERS & TEAM PROGRESS */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          
          {/* TEAM MEMBERS WIDGET */}
          <div className={`${cardBg} border rounded-xl p-5 transition-all`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>Team Members</h3>
              <button
                onClick={() => setShowInviteMemberModal(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-[rgb(119,136,115)] hover:bg-[rgb(119,136,115)]/80 text-white' 
                    : 'bg-[rgb(119,136,115)] hover:bg-[rgb(119,136,115)]/90 text-white'
                }`}
                title="Invite a new member"
              >
                <Plus size={14} />
                Invite
              </button>
            </div>
            
            {membersLoading ? (
              <div className="text-center py-4">
                <div className={`inline-block animate-spin rounded-full h-5 w-5 border-b-2 ${isDarkMode ? 'border-[rgb(119,136,115)]' : 'border-[rgb(119,136,115)]'}`}></div>
              </div>
            ) : members.length === 0 ? (
              <p className={`text-sm ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>No members found</p>
            ) : (
              <>
                <div className="space-y-3">
                  {members.slice(0, 4).map((member) => (
                    <div key={member.id} className={`flex items-center gap-4 p-2 rounded-lg transition-all ${isDarkMode ? 'hover:bg-[rgb(45,52,45)]/50' : 'hover:bg-[rgb(210,220,182)]/20'}`}>
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium ${isDarkMode ? 'bg-[rgb(119,136,115)] text-white' : 'bg-[rgb(210,220,182)] text-[rgb(60,68,58)]'}`}>
                        {member.username?.substring(0, 2).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-[rgb(210,220,182)]' : 'text-[rgb(60,68,58)]'}`}>
                          {member.username}
                        </p>
                        <p className={`text-xs truncate ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
                          {member.role}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {members.length > 4 && (
                  <button className={`w-full mt-3 py-2 text-sm font-medium border-t transition-colors ${isDarkMode ? 'text-[rgb(161,188,152)] hover:text-white border-[rgb(45,52,45)]/50' : 'text-[rgb(119,136,115)] hover:text-[rgb(60,68,58)] border-[rgb(210,220,182)]'}`}>
                    View All {members.length} Members
                  </button>
                )}
              </>
            )}
          </div>

          {/* TEAM PROGRESS WIDGET */}
          <div className={`${cardBg} border rounded-xl p-5 transition-all`}>
            <h3 className={`font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>Team Progress</h3>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className={`${isDarkMode ? 'bg-[rgb(45,52,45)]/50' : 'bg-[rgb(210,220,182)]/30'} rounded-lg p-4 text-center`}>
                <div className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>
                  {stats.total_projects || 0}
                </div>
                <div className={`text-xs font-medium ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
                  Total Projects
                </div>
              </div>
              <div className={`${isDarkMode ? 'bg-[rgb(45,52,45)]/50' : 'bg-[rgb(210,220,182)]/30'} rounded-lg p-4 text-center`}>
                <div className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>
                  {stats.total_members || 0}
                </div>
                <div className={`text-xs font-medium ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
                  Team Members
                </div>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-3">
              <div>
                <div className={`flex justify-between items-center mb-1.5 ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
                  <span className="text-xs">Tasks Completed</span>
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-[rgb(210,220,182)]' : 'text-[rgb(60,68,58)]'}`}>
                    {stats.completed_tasks || 0}/{stats.total_tasks || 0}
                  </span>
                </div>
                <div className={`w-full rounded-full h-2 ${isDarkMode ? 'bg-[rgb(45,52,45)]' : 'bg-[rgb(210,220,182)]'}`}>
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${stats.total_tasks > 0 ? (stats.completed_tasks / stats.total_tasks * 100) : 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className={`flex justify-between items-center mb-1.5 ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
                  <span className="text-xs">In Progress</span>
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-[rgb(210,220,182)]' : 'text-[rgb(60,68,58)]'}`}>
                    {stats.in_progress_tasks || 0}
                  </span>
                </div>
                <div className={`w-full rounded-full h-2 ${isDarkMode ? 'bg-[rgb(45,52,45)]' : 'bg-[rgb(210,220,182)]'}`}>
                  <div 
                    className="bg-amber-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${stats.total_tasks > 0 ? (stats.in_progress_tasks / stats.total_tasks * 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* PROJECTS SECTION - FULL WIDTH */}
        <div className="space-y-6">
          
          {/* Filter Bar */}
          <div className={`${cardBg} border rounded-xl p-6`}>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(119,136,115)]" size={18} />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full rounded-lg py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(119,136,115)]/50 transition-all placeholder:opacity-60 ${
                    isDarkMode 
                      ? 'bg-[rgb(24,28,24)] text-white border border-[rgb(45,52,45)] placeholder:text-[rgb(161,188,152)]' 
                      : 'bg-white text-[rgb(60,68,58)] border border-[rgb(210,220,182)] placeholder:text-[rgb(119,136,115)]'
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(119,136,115)] hover:text-[rgb(161,188,152)]"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowCreateProjectModal(true)}
                className="flex items-center justify-center gap-2 bg-[rgb(119,136,115)] hover:bg-[rgb(161,188,152)] text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg shadow-[rgb(119,136,115)]/20 transition-all active:scale-95 whitespace-nowrap"
              >
                <Plus size={18} />
                Create Project
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  <FilterButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} darkMode={isDarkMode}>All</FilterButton>
                  <FilterButton active={statusFilter === 'active'} onClick={() => setStatusFilter('active')} darkMode={isDarkMode}>Active</FilterButton>
                  <FilterButton active={statusFilter === 'completed'} onClick={() => setStatusFilter('completed')} darkMode={isDarkMode}>Completed</FilterButton>
                  <FilterButton active={statusFilter === 'archived'} onClick={() => setStatusFilter('archived')} darkMode={isDarkMode}>Archived</FilterButton>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
                  Sort By
                </label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)} 
                  className={`w-full md:w-auto rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(119,136,115)]/50 transition-all ${
                    isDarkMode 
                      ? 'bg-[rgb(24,28,24)] text-white border border-[rgb(45,52,45)]' 
                      : 'bg-white text-[rgb(60,68,58)] border border-[rgb(210,220,182)]'
                  }`}
                >
                  <option value="created_at">Recently Created</option>
                  <option value="name">Project Name</option>
                  <option value="progress">Progress</option>
                </select>
              </div>
            </div>
          </div>

          {/* Projects Header */}
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>
              Projects
              {!projectsLoading && filteredProjects.length > 0 && (
                <span className={`ml-2 text-sm font-normal ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
                  ({filteredProjects.length} {filteredProjects.length !== projects.length ? `of ${projects.length}` : ''})
                </span>
              )}
            </h2>
          </div>

          {/* Projects Grid */}
          {projectsLoading ? (
            <div className={`${cardBg} border rounded-xl p-8 text-center`}>
              <div className={`inline-block animate-spin rounded-full h-6 w-6 border-b-2 ${isDarkMode ? 'border-[rgb(119,136,115)]' : 'border-[rgb(119,136,115)]'}`}></div>
              <p className={`mt-3 text-sm ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className={`${cardBg} border rounded-xl p-8 text-center`}>
              <FolderKanban size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-[rgb(119,136,115)]' : 'text-[rgb(161,188,152)]'}`} />
              <p className={`${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
                {searchQuery || statusFilter !== 'all' 
                  ? 'No projects match your filters' 
                  : 'No projects yet in this team'}
              </p>
              {(searchQuery || statusFilter !== 'all') && (
                <button
                  onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                  className={`mt-4 text-sm font-medium ${isDarkMode ? 'text-[rgb(161,188,152)] hover:text-white' : 'text-[rgb(119,136,115)] hover:text-[rgb(60,68,58)]'}`}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  darkMode={isDarkMode}
                  onClick={() => navigate(`/teams/${teamId}/projects/${project.id}`)}
                  onEdit={(proj) => {
                    setSelectedProject(proj);
                    setShowEditProjectModal(true);
                  }}
                  onDelete={(proj) => {
                    setSelectedProject(proj);
                    setShowDeleteProjectModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* MODALS */}
      <EditTeamModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        team={team}
        onSubmit={(updates) => updateTeamMutation.mutateAsync(updates)}
        darkMode={isDarkMode}
      />

      <InviteMemberModal
        isOpen={showInviteMemberModal}
        onClose={() => setShowInviteMemberModal(false)}
        teamId={team?.id}
        darkMode={isDarkMode}
      />

      <DeleteTeamModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        team={team}
        onConfirm={() => deleteTeamMutation.mutate()}
        darkMode={isDarkMode}
      />

      <CreateProjectModal
        isOpen={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        teamId={teamId}
        teamMembers={members}
        onSubmit={(projectData) => createProjectMutation.mutateAsync(projectData)}
        darkMode={isDarkMode}
      />

      <EditProjectModal
        isOpen={showEditProjectModal}
        onClose={() => {
          setShowEditProjectModal(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        onSubmit={(updates) => updateProjectMutation.mutateAsync({ projectId: selectedProject.id, updates })}
        darkMode={isDarkMode}
        teamMembers={membersData?.data}
        teamId={teamData?.data?.id}
        queryClient={queryClient}
      />

      <DeleteProjectModal
        isOpen={showDeleteProjectModal}
        onClose={() => {
          setShowDeleteProjectModal(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        onConfirm={() => deleteProjectMutation.mutate(selectedProject.id)}
        darkMode={isDarkMode}
      />
    </div>
  );
}