import React, { useState, useEffect } from 'react';
import * as projectApi from './services/projectApi';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  Settings, 
  Search, 
  Bell, 
  Plus, 
  MoreVertical, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Menu,
  Zap,
  MessageSquare,
  Sun,
  Moon,
  FileText,
  LogOut,
  User,
  HelpCircle,
  ArrowLeft,
  Calendar,
  Circle,
  PlayCircle,
  Eye,
  Edit3,
  Trash2,
  Flag,
  Paperclip
} from 'lucide-react';

/**
 * UTILITY FUNCTIONS
 */
const sanitizeText = (text) => {
  if (!text) return '';
  return text.replace(/[<>]/g, '');
};

const formatDate = (dateString) => {
  if (!dateString) return 'No deadline';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Invalid date';
  }
};

const getDaysUntilDue = (dueDateString) => {
  if (!dueDateString) return null;
  const due = new Date(dueDateString);
  const now = new Date();
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const canEditTasks = (userRole) => {
  return userRole === 'lead' || userRole === 'editor';
};

/**
 * SHARED COMPONENTS (Same as Homepage)
 */
const SidebarItem = ({ icon: Icon, label, active = false, hasNotification = false, badgeCount = 0, darkMode }) => (
  <button 
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
      active 
        ? 'bg-[rgb(119,136,115)]/10 text-[rgb(119,136,115)] border-r-2 border-[rgb(119,136,115)]' 
        : `${darkMode ? 'text-[rgb(161,188,152)] hover:bg-[rgb(45,52,45)] hover:text-[rgb(210,220,182)]' : 'text-[rgb(119,136,115)] hover:bg-[rgb(210,220,182)]/50 hover:text-[rgb(60,68,58)]'}`
    }`}
  >
    <Icon size={20} className={active ? 'text-[rgb(119,136,115)]' : `${darkMode ? 'text-[rgb(119,136,115)] group-hover:text-[rgb(161,188,152)]' : 'text-[rgb(161,188,152)] group-hover:text-[rgb(119,136,115)]'}`} />
    <span className="font-medium text-sm">{label}</span>
    {hasNotification && (
      <span className="ml-auto w-2 h-2 rounded-full bg-red-500"></span>
    )}
    {badgeCount > 0 && (
      <span className="ml-auto bg-[rgb(119,136,115)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
        {badgeCount}
      </span>
    )}
  </button>
);

/**
 * PROJECT-SPECIFIC COMPONENTS
 */
const TaskStatusBadge = ({ status }) => {
  const statusConfig = {
    todo: { label: 'To Do', icon: Circle, color: 'text-slate-500 bg-slate-500/10' },
    in_progress: { label: 'In Progress', icon: PlayCircle, color: 'text-blue-500 bg-blue-500/10' },
    review: { label: 'Review', icon: Eye, color: 'text-purple-500 bg-purple-500/10' },
    done: { label: 'Done', icon: CheckCircle2, color: 'text-green-500 bg-green-500/10' },
  };

  const config = statusConfig[status] || statusConfig.todo;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const priorityConfig = {
    low: { label: 'Low', icon: Flag, color: 'text-slate-500 bg-slate-500/10' },
    medium: { label: 'Medium', icon: Flag, color: 'text-amber-500 bg-amber-500/10' },
    high: { label: 'High', icon: Flag, color: 'text-orange-500 bg-orange-500/10' },
    urgent: { label: 'Urgent', icon: Flag, color: 'text-red-500 bg-red-500/10' },
  };

  const config = priorityConfig[priority] || priorityConfig.medium;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};

const TaskCard = ({ task, darkMode, userRole, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const daysUntilDue = getDaysUntilDue(task.due_date);
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isDueSoon = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 3;

  const canEdit = canEditTasks(userRole);

  return (
    <div className={`${darkMode ? 'bg-[rgb(30,36,30)]/50 border-[rgb(45,52,45)]/50 hover:border-[rgb(119,136,115)]/50' : 'bg-white border-[rgb(210,220,182)] shadow-sm hover:border-[rgb(161,188,152)]'} border rounded-xl p-5 transition-all group`}>
      
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-[rgb(241,243,224)]' : 'text-[rgb(60,68,58)]'}`}>
            {sanitizeText(task.title)}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
        </div>

        {canEdit && (
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-[rgb(45,52,45)] text-[rgb(161,188,152)]' : 'hover:bg-[rgb(210,220,182)]/50 text-[rgb(119,136,115)]'}`}
            >
              <MoreVertical size={18} />
            </button>

            {showActions && (
              <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border overflow-hidden z-10 ${darkMode ? 'bg-[rgb(30,36,30)] border-[rgb(45,52,45)]' : 'bg-white border-[rgb(210,220,182)]'}`}>
                <button
                  onClick={() => { onEdit(task); setShowActions(false); }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${darkMode ? 'hover:bg-[rgb(45,52,45)] text-[rgb(210,220,182)]' : 'hover:bg-[rgb(210,220,182)]/30 text-[rgb(60,68,58)]'}`}
                >
                  <Edit3 size={14} />
                  Edit Task
                </button>
                <button
                  onClick={() => { onDelete(task); setShowActions(false); }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${darkMode ? 'hover:bg-[rgb(45,52,45)] text-red-400' : 'hover:bg-[rgb(210,220,182)]/30 text-red-600'}`}
                >
                  <Trash2 size={14} />
                  Delete Task
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {task.description && (
        <p className={`${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'} text-sm mb-4 ${isExpanded ? '' : 'line-clamp-2'}`}>
          {sanitizeText(task.description)}
        </p>
      )}

      {task.description && task.description.length > 100 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`text-xs font-medium mb-3 ${darkMode ? 'text-[rgb(119,136,115)] hover:text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)] hover:text-[rgb(60,68,58)]'}`}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}

      <div className={`space-y-3 pt-3 border-t ${darkMode ? 'border-[rgb(45,52,45)]/50' : 'border-[rgb(210,220,182)]'}`}>
        
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
            Assigned to:
          </span>
          <div className="flex items-center gap-2">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${task.assignee_id ? (darkMode ? 'bg-[rgb(119,136,115)] text-white' : 'bg-[rgb(210,220,182)] text-[rgb(60,68,58)]') : (darkMode ? 'bg-[rgb(45,52,45)] text-[rgb(161,188,152)]' : 'bg-[rgb(210,220,182)]/50 text-[rgb(119,136,115)]')}`}>
              {task.assignee_name ? task.assignee_name.charAt(0).toUpperCase() : '?'}
            </div>
            <span className={`text-sm font-medium ${darkMode ? 'text-[rgb(210,220,182)]' : 'text-[rgb(60,68,58)]'}`}>
              {sanitizeText(task.assignee_name)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
            Due date:
          </span>
          <div className="flex items-center gap-1.5">
            <Clock size={14} className={isOverdue ? 'text-red-500' : isDueSoon ? 'text-amber-500' : (darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]')} />
            <span className={`text-sm font-medium ${isOverdue ? 'text-red-500' : isDueSoon ? 'text-amber-500' : (darkMode ? 'text-[rgb(210,220,182)]' : 'text-[rgb(60,68,58)]')}`}>
              {formatDate(task.due_date)}
              {isOverdue && ' (Overdue)'}
              {isDueSoon && !isOverdue && ` (${daysUntilDue}d left)`}
            </span>
          </div>
        </div>

        <div className={`flex items-center gap-4 pt-2 border-t ${darkMode ? 'border-[rgb(45,52,45)]/50' : 'border-[rgb(210,220,182)]'}`}>
          <div className={`flex items-center gap-1.5 text-xs ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
            <MessageSquare size={14} />
            <span>{task.comments_count}</span>
          </div>
          <div className={`flex items-center gap-1.5 text-xs ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
            <Paperclip size={14} />
            <span>{task.attachments_count}</span>
          </div>
          <div className={`flex items-center gap-1 text-xs ml-auto ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
            Updated {formatDate(task.updated_at)}
          </div>
        </div>
      </div>
    </div>
  );
};

const FilterButton = ({ active, children, onClick, darkMode }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      active
        ? 'bg-[rgb(119,136,115)] text-white shadow-md'
        : darkMode
        ? 'bg-[rgb(30,36,30)]/50 text-[rgb(161,188,152)] hover:bg-[rgb(45,52,45)] hover:text-[rgb(210,220,182)]'
        : 'bg-white text-[rgb(119,136,115)] border border-[rgb(210,220,182)] hover:bg-[rgb(210,220,182)]/30 hover:text-[rgb(60,68,58)]'
    }`}
  >
    {children}
  </button>
);

/**
 * MAIN PROJECT PAGE COMPONENT
 */
export default function ProjectPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setDarkMode] = useState(true);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [projectData, setProjectData] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('due_date');

  const projectId = 1; // Hardcoded for testing with project ID 1
  const userRole = projectData?.user_role || 'viewer'; // Get role from API response

  // Fetch project data on component mount
  useEffect(() => {
    async function fetchProjectData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [projectRes, tasksRes, membersRes] = await Promise.all([
          projectApi.getProject(projectId),
          projectApi.getProjectTasks(projectId),
          projectApi.getProjectMembers(projectId),
        ]);

        if (projectRes.success) {
          setProjectData(projectRes.data);
        }

        if (tasksRes.success) {
          setTasks(tasksRes.data);
        }

        if (membersRes.success) {
          setProjectMembers(membersRes.data);
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch project data:', err);
        setError(err.message || 'Failed to load project data');
        setLoading(false);
      }
    }

    fetchProjectData();
  }, [projectId]);

  // Theme classes
  const bgMain = isDarkMode ? 'bg-[rgb(24,28,24)]' : 'bg-[rgb(241,243,224)]';
  const textMain = isDarkMode ? 'text-[rgb(210,220,182)]' : 'text-[rgb(60,68,58)]';
  const bgSidebar = isDarkMode ? 'bg-[rgb(30,36,30)] border-[rgb(45,52,45)]' : 'bg-white border-[rgb(210,220,182)] shadow-sm';
  const bgHeader = isDarkMode ? 'bg-[rgb(24,28,24)]/80 border-[rgb(45,52,45)]/50' : 'bg-white/80 border-[rgb(210,220,182)]/50';
  const inputBg = isDarkMode ? 'bg-[rgb(30,36,30)] border-[rgb(45,52,45)] text-[rgb(210,220,182)] placeholder:text-[rgb(119,136,115)]' : 'bg-[rgb(210,220,182)]/30 border-[rgb(161,188,152)] text-[rgb(60,68,58)] placeholder:text-[rgb(119,136,115)]';
  const cardBg = isDarkMode ? 'bg-[rgb(30,36,30)]/50 border-[rgb(45,52,45)]/50' : 'bg-white border-[rgb(210,220,182)] shadow-sm';

  // Filter and sort tasks
  const filteredTasks = tasks.filter(task => {
    if (searchQuery && !sanitizeText(task.title.toLowerCase()).includes(sanitizeText(searchQuery.toLowerCase())) && 
        !sanitizeText(task.description?.toLowerCase() || '').includes(sanitizeText(searchQuery.toLowerCase()))) {
      return false;
    }
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned' && task.assignee_id !== null) return false;
      if (assigneeFilter !== 'unassigned' && task.assignee_id !== parseInt(assigneeFilter)) return false;
    }
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'due_date':
        return new Date(a.due_date || '9999-12-31') - new Date(b.due_date || '9999-12-31');
      case 'priority':
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      case 'status':
        const statusOrder = { todo: 0, in_progress: 1, review: 2, done: 3 };
        return statusOrder[a.status] - statusOrder[b.status];
      case 'created_at':
        return new Date(b.created_at) - new Date(a.created_at);
      default:
        return 0;
    }
  });

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => getDaysUntilDue(t.due_date) !== null && getDaysUntilDue(t.due_date) < 0 && t.status !== 'done').length,
  };

  const handleEditTask = async (task) => {
    console.log('Edit task:', task.id);
    // TODO: Implement edit dialog
    alert(`Edit task: ${task.title}\n\nNote: Backend validates 'lead' or 'editor' role with Zod schemas.`);
  };

  const handleDeleteTask = async (task) => {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
      return;
    }

    try {
      const response = await projectApi.deleteTask(projectId, task.id);
      
      if (response.success) {
        // Remove task from local state
        setTasks(tasks.filter(t => t.id !== task.id));
        console.log('✅ Task deleted:', response.message);
      }
    } catch (err) {
      alert(`Failed to delete task: ${err.message}`);
      console.error('Delete task error:', err);
    }
  };

  const handleCreateTask = async () => {
    // TODO: Implement create task dialog with form
    console.log('Create new task');
    alert('Create new task\n\nNote: Requires proper authentication and RBAC validation.');
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-blue-500/30 transition-colors duration-300 ${bgMain} ${textMain}`}>
      <div className="flex h-screen overflow-hidden">
        
        {/* SIDEBAR - Same as Homepage */}
        <aside 
          className={`${isSidebarOpen ? 'w-64' : 'w-0 -ml-4'} 
          ${bgSidebar} border-r flex flex-col transition-all duration-300 absolute z-20 h-full lg:relative lg:w-64`}
        >
          <div className="p-6 flex items-center space-x-3">
            <div className="w-8 h-8 bg-[rgb(119,136,115)] rounded-lg flex items-center justify-center">
              <span className="font-bold text-white text-lg">Z</span>
            </div>
            <span className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>Zomato Inc</span>
          </div>

          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-2 mt-2">Main Menu</div>
            <SidebarItem icon={LayoutDashboard} label="Dashboard" darkMode={isDarkMode} />
            <SidebarItem icon={MessageSquare} label="Messages" darkMode={isDarkMode} badgeCount={3} />
            <SidebarItem icon={FolderKanban} label="Projects" active darkMode={isDarkMode} />
            <SidebarItem icon={Users} label="Team Members" darkMode={isDarkMode} />
            <SidebarItem icon={Settings} label="Settings" darkMode={isDarkMode} />

            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-2 mt-8">Pinned Projects</div>
            {['UI/UX Revamp', 'API V2 Migration', 'Q4 Marketing'].map((item, i) => (
              <button key={i} className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${isDarkMode ? 'text-[rgb(161,188,152)] hover:text-[rgb(210,220,182)] hover:bg-[rgb(45,52,45)]/50' : 'text-[rgb(119,136,115)] hover:text-[rgb(60,68,58)] hover:bg-[rgb(210,220,182)]/30'}`}>
                <span className={`w-2 h-2 rounded-full mr-3 ${['bg-[rgb(119,136,115)]', 'bg-purple-500', 'bg-green-500'][i]}`}></span>
                {item}
              </button>
            ))}
          </nav>

          <div className={`p-4 border-t ${isDarkMode ? 'border-[rgb(45,52,45)]' : 'border-[rgb(210,220,182)]'}`}>
             <button className={`w-full flex items-center justify-center space-x-2 py-2.5 px-4 border rounded-lg transition-all text-sm font-medium ${isDarkMode ? 'border-[rgb(45,52,45)] text-[rgb(161,188,152)] hover:bg-[rgb(45,52,45)] hover:text-white' : 'border-[rgb(161,188,152)] text-[rgb(119,136,115)] hover:bg-[rgb(210,220,182)]/30 hover:text-[rgb(60,68,58)]'}`}>
               <Zap size={16} className="text-amber-500" />
               <span>Upgrade Plan</span>
             </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          
          {/* HEADER - Same as Homepage */}
          <header className={`h-20 backdrop-blur-md border-b flex items-center justify-between px-6 sticky top-0 z-10 transition-colors duration-300 ${bgHeader}`}>
            <div className="flex items-center space-x-4">
              <button onClick={() => setSidebarOpen(!isSidebarOpen)} className={`lg:hidden ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <Menu />
              </button>
              
              <button className="flex items-center space-x-2 bg-[rgb(119,136,115)] hover:bg-[rgb(161,188,152)] text-white px-4 py-2 rounded-full font-semibold shadow-lg shadow-[rgb(119,136,115)]/20 transition-all active:scale-95">
                <Plus size={18} />
                <span>Create</span>
              </button>
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(119,136,115)] group-focus-within:text-[rgb(161,188,152)] transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className={`w-80 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(119,136,115)]/50 focus:border-[rgb(119,136,115)] transition-all ${inputBg}`}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <button 
                onClick={() => setDarkMode(!isDarkMode)}
                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-[rgb(161,188,152)] hover:text-white hover:bg-[rgb(45,52,45)]' : 'text-[rgb(119,136,115)] hover:text-[rgb(60,68,58)] hover:bg-[rgb(210,220,182)]'}`}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <button className={`relative p-2 transition-colors ${isDarkMode ? 'text-[rgb(161,188,152)] hover:text-white' : 'text-[rgb(119,136,115)] hover:text-[rgb(60,68,58)]'}`}>
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-inherit"></span>
              </button>
              
              <div className={`h-8 w-[1px] mx-2 ${isDarkMode ? 'bg-[rgb(45,52,45)]' : 'bg-[rgb(210,220,182)]'}`}></div>

              <div className="relative">
                <button 
                  onClick={() => setDropdownOpen(!isDropdownOpen)}
                  className={`h-10 w-10 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all hover:ring-2 hover:ring-[rgb(119,136,115)]/50 ${isDarkMode ? 'bg-[rgb(45,52,45)] border-[rgb(119,136,115)]' : 'bg-[rgb(210,220,182)] border-white shadow-sm'}`}
                >
                  <User size={20} className={isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'} />
                </button>

                {isDropdownOpen && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg border overflow-hidden ${isDarkMode ? 'bg-[rgb(30,36,30)] border-[rgb(45,52,45)]' : 'bg-white border-[rgb(210,220,182)]'}`}>
                    <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-[rgb(45,52,45)]' : 'border-[rgb(210,220,182)]'}`}>
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>Alex Johnson</p>
                      <p className={`text-xs ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>alex@company.com</p>
                    </div>
                    
                    <button className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors ${isDarkMode ? 'hover:bg-[rgb(45,52,45)] text-[rgb(210,220,182)]' : 'hover:bg-[rgb(210,220,182)]/30 text-[rgb(60,68,58)]'}`}>
                      <FileText size={16} />
                      <span className="text-sm font-medium">My Tasks</span>
                    </button>
                    
                    <button className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors ${isDarkMode ? 'hover:bg-[rgb(45,52,45)] text-[rgb(210,220,182)]' : 'hover:bg-[rgb(210,220,182)]/30 text-[rgb(60,68,58)]'}`}>
                      <User size={16} />
                      <span className="text-sm font-medium">Profile Settings</span>
                    </button>
                    
                    <button className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors ${isDarkMode ? 'hover:bg-[rgb(45,52,45)] text-[rgb(210,220,182)]' : 'hover:bg-[rgb(210,220,182)]/30 text-[rgb(60,68,58)]'}`}>
                      <HelpCircle size={16} />
                      <span className="text-sm font-medium">Help & Support</span>
                    </button>
                    
                    <div className={`border-t ${isDarkMode ? 'border-[rgb(45,52,45)]' : 'border-[rgb(210,220,182)]'}`}>
                      <button className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors ${isDarkMode ? 'hover:bg-[rgb(45,52,45)] text-red-400' : 'hover:bg-[rgb(210,220,182)]/30 text-red-600'}`}>
                        <LogOut size={16} />
                        <span className="text-sm font-medium">Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* SCROLLABLE CONTENT - PROJECT SPECIFIC */}
          <div className="flex-1 overflow-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
              
              {/* Back Button */}
              <button className={`flex items-center gap-2 mb-6 ${isDarkMode ? 'text-[rgb(161,188,152)] hover:text-[rgb(210,220,182)]' : 'text-[rgb(119,136,115)] hover:text-[rgb(60,68,58)]'} transition-colors`}>
                <ArrowLeft size={20} />
                <span className="font-medium">Back to Projects</span>
              </button>

              {/* Loading State */}
              {loading && (
                <div className={`${cardBg} border rounded-xl p-12 text-center`}>
                  <div className="animate-spin w-12 h-12 border-4 border-[rgb(119,136,115)] border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className={`text-lg ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>Loading project data...</p>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className={`border border-red-500 bg-red-500/10 rounded-xl p-6 text-center`}>
                  <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-red-500 mb-2">Failed to Load Project</h3>
                  <p className="text-red-400">{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Project Content (Only show when loaded successfully) */}
              {!loading && !error && projectData && (
                <>
                  {/* Project Header */}
                  <div className={`${cardBg} border rounded-xl p-6 mb-8`}>
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>
                          {sanitizeText(projectData.name)}
                        </h1>
                        <p className={`${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'} mb-4`}>
                          {sanitizeText(projectData.description)}
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${projectData.status === 'active' ? 'text-green-500 bg-green-500/10' : projectData.status === 'completed' ? 'text-blue-500 bg-blue-500/10' : 'text-slate-500 bg-slate-500/10'}`}>
                            <CheckCircle2 size={12} />
                            {projectData.status}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${isDarkMode ? 'bg-[rgb(45,52,45)] text-[rgb(161,188,152)]' : 'bg-[rgb(210,220,182)] text-[rgb(119,136,115)]'}`}>
                            <Calendar size={12} />
                            {formatDate(projectData.start_date)} - {formatDate(projectData.end_date)}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
                            userRole === 'lead' ? 'bg-purple-500/10 text-purple-500' :
                            userRole === 'editor' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-slate-500/10 text-slate-500'
                          }`}>
                            <User size={12} />
                            Your Role: {userRole}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <div className="flex -space-x-2">
                          {projectMembers.map((member) => (
                            <div key={member.id} className="relative group">
                              <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all cursor-pointer group-hover:scale-110 group-hover:z-10 ${isDarkMode ? 'border-[rgb(30,36,30)] bg-[rgb(119,136,115)] text-white' : 'border-white bg-[rgb(210,220,182)] text-[rgb(60,68,58)]'}`}>
                                {member.username.charAt(0).toUpperCase()}
                              </div>
                              <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${isDarkMode ? 'bg-[rgb(45,52,45)] text-white' : 'bg-[rgb(60,68,58)] text-white'}`}>
                                {member.username} ({member.role})
                              </div>
                            </div>
                          ))}
                        </div>
                        <span className={`text-xs ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
                          {projectMembers.length} team members
                        </span>
                      </div>
                    </div>

                    <div className={`pt-4 border-t ${isDarkMode ? 'border-[rgb(45,52,45)]/50' : 'border-[rgb(210,220,182)]'}`}>
                      <span className={`inline-flex items-center gap-2 text-xs font-medium ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
                        <User size={14} />
                        Your role: <span className={`font-bold uppercase ${isDarkMode ? 'text-[rgb(210,220,182)]' : 'text-[rgb(60,68,58)]'}`}>{userRole}</span>
                        {canEditTasks(userRole) && <span className="text-green-500">(Can edit tasks)</span>}
                      </span>
                    </div>
                  </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {[
                  { label: 'Total', value: stats.total, icon: FolderKanban, color: 'bg-blue-500/10 text-blue-500' },
                  { label: 'To Do', value: stats.todo, icon: Circle, color: 'bg-slate-500/10 text-slate-500' },
                  { label: 'In Progress', value: stats.in_progress, icon: PlayCircle, color: 'bg-blue-500/10 text-blue-500' },
                  { label: 'Review', value: stats.review, icon: Eye, color: 'bg-purple-500/10 text-purple-500' },
                  { label: 'Done', value: stats.done, icon: CheckCircle2, color: 'bg-green-500/10 text-green-500' },
                  { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'bg-red-500/10 text-red-500' },
                ].map((stat, i) => (
                  <div key={i} className={`${cardBg} border p-4 rounded-xl transition-all hover:scale-105 cursor-pointer`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
                      <stat.icon size={16} />
                    </div>
                    <h3 className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>{stat.value}</h3>
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className={`${cardBg} border rounded-xl p-6 mb-6`}>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(119,136,115)]" size={18} />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(119,136,115)]/50 transition-all ${inputBg}`}
                    />
                  </div>

                  {canEditTasks(userRole) && (
                    <button
                      onClick={handleCreateTask}
                      className="flex items-center justify-center gap-2 bg-[rgb(119,136,115)] hover:bg-[rgb(161,188,152)] text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg shadow-[rgb(119,136,115)]/20 transition-all active:scale-95 whitespace-nowrap"
                    >
                      <Plus size={18} />
                      Create Task
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
                      Status
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <FilterButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} darkMode={isDarkMode}>All</FilterButton>
                      <FilterButton active={statusFilter === 'todo'} onClick={() => setStatusFilter('todo')} darkMode={isDarkMode}>To Do</FilterButton>
                      <FilterButton active={statusFilter === 'in_progress'} onClick={() => setStatusFilter('in_progress')} darkMode={isDarkMode}>In Progress</FilterButton>
                      <FilterButton active={statusFilter === 'review'} onClick={() => setStatusFilter('review')} darkMode={isDarkMode}>Review</FilterButton>
                      <FilterButton active={statusFilter === 'done'} onClick={() => setStatusFilter('done')} darkMode={isDarkMode}>Done</FilterButton>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
                      Priority
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <FilterButton active={priorityFilter === 'all'} onClick={() => setPriorityFilter('all')} darkMode={isDarkMode}>All</FilterButton>
                      <FilterButton active={priorityFilter === 'urgent'} onClick={() => setPriorityFilter('urgent')} darkMode={isDarkMode}>Urgent</FilterButton>
                      <FilterButton active={priorityFilter === 'high'} onClick={() => setPriorityFilter('high')} darkMode={isDarkMode}>High</FilterButton>
                      <FilterButton active={priorityFilter === 'medium'} onClick={() => setPriorityFilter('medium')} darkMode={isDarkMode}>Medium</FilterButton>
                      <FilterButton active={priorityFilter === 'low'} onClick={() => setPriorityFilter('low')} darkMode={isDarkMode}>Low</FilterButton>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>Sort By</label>
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={`w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(119,136,115)]/50 transition-all ${inputBg}`}>
                        <option value="due_date">Due Date</option>
                        <option value="priority">Priority</option>
                        <option value="status">Status</option>
                        <option value="created_at">Recently Created</option>
                      </select>
                    </div>

                    <div className="flex-1">
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>Assignee</label>
                      <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className={`w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(119,136,115)]/50 transition-all ${inputBg}`}>
                        <option value="all">All Members</option>
                        {projectMembers.map(member => (
                          <option key={member.user_id} value={member.user_id}>{member.username}</option>
                        ))}
                        <option value="unassigned">Unassigned</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tasks List */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>
                    Tasks ({filteredTasks.length})
                  </h2>
                  {filteredTasks.length !== tasks.length && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                        setPriorityFilter('all');
                        setAssigneeFilter('all');
                      }}
                      className={`text-sm font-medium ${isDarkMode ? 'text-[rgb(119,136,115)] hover:text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)] hover:text-[rgb(60,68,58)]'}`}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {filteredTasks.length === 0 ? (
                  <div className={`${cardBg} border rounded-xl p-12 text-center`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkMode ? 'bg-[rgb(45,52,45)]' : 'bg-[rgb(210,220,182)]'}`}>
                      <Search size={32} className={isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'} />
                    </div>
                    <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>No tasks found</h3>
                    <p className={`${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>Try adjusting your filters or search query</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        darkMode={isDarkMode}
                        userRole={userRole}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                  </div>
                )}
              </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
