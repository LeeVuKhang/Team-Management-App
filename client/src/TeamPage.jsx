import React, { useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTeam, getTeamProjects, getTeamStats, getTeamMembers } from './services/projectApi';
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
  X
} from 'lucide-react';

/**
 * COMPONENTS
 */

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

const ProjectCard = ({ project, darkMode }) => {
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
    <div className={`${darkMode ? 'bg-[rgb(30,36,30)]/50 border-[rgb(45,52,45)]/50' : 'bg-white border-[rgb(210,220,182)] shadow-sm'} border rounded-xl p-5 hover:border-[rgb(161,188,152)] transition-all flex flex-col h-full`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className={`font-semibold text-lg ${darkMode ? 'text-[rgb(241,243,224)]' : 'text-[rgb(60,68,58)]'}`}>{project.name}</h3>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
      </div>
      
      <p className={`${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'} text-sm mb-6 line-clamp-2 flex-grow`}>
        {project.description || 'No description provided'}
      </p>

      <div className="mt-auto space-y-4">
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

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');

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
        <div className="mb-8">
          <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>
            {team?.name || 'Team Dashboard'} 👋
          </h1>
          <p className={`${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
            {team?.description || "Here's what's happening with team projects today."}
          </p>
        </div>

        {/* TOP ROW: TEAM MEMBERS & TEAM PROGRESS */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          
          {/* TEAM MEMBERS WIDGET */}
          <div className={`${cardBg} border rounded-xl p-5 transition-all`}>
            <h3 className={`font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>Team Members</h3>
            
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
                onClick={() => alert('Create Project feature coming soon!')}
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
                <ProjectCard key={project.id} project={project} darkMode={isDarkMode} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}