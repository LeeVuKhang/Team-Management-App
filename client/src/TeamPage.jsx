import React from 'react';
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
  Users
} from 'lucide-react';

/**
 * COMPONENTS
 */

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

        {/* STATS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STATS.map((stat, i) => (
            <div key={i} className={`${cardBg} border p-5 rounded-xl flex flex-col justify-between transition-all cursor-pointer group hover:shadow-lg hover:-translate-y-1 ${isDarkMode ? 'hover:border-[rgb(119,136,115)] hover:bg-[rgb(30,36,30)]' : 'hover:border-[rgb(161,188,152)] hover:shadow-[rgb(210,220,182)]'}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-all group-hover:scale-110 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <h3 className={`text-3xl font-bold mb-1 transition-colors ${isDarkMode ? 'text-white group-hover:text-[rgb(210,220,182)]' : 'text-[rgb(60,68,58)] group-hover:text-[rgb(119,136,115)]'}`}>{stat.value}</h3>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* DASHBOARD GRID */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* LEFT: PROJECTS (2 cols width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>
                Active Projects
                {!projectsLoading && projects.length > 0 && (
                  <span className={`ml-2 text-sm font-normal ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
                    ({projects.length})
                  </span>
                )}
              </h2>
            </div>

            {projectsLoading ? (
              <div className={`${cardBg} border rounded-xl p-8 text-center`}>
                <div className={`inline-block animate-spin rounded-full h-6 w-6 border-b-2 ${isDarkMode ? 'border-[rgb(119,136,115)]' : 'border-[rgb(119,136,115)]'}`}></div>
                <p className={`mt-3 text-sm ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className={`${cardBg} border rounded-xl p-8 text-center`}>
                <FolderKanban size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-[rgb(119,136,115)]' : 'text-[rgb(161,188,152)]'}`} />
                <p className={`${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>No projects yet in this team</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {projects.slice(0, 5).map((project) => (
                  <ProjectCard key={project.id} project={project} darkMode={isDarkMode} />
                ))}
                
                {/* Add New Placeholder */}
                <button className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all group h-full min-h-[240px] ${isDarkMode ? 'border-[rgb(45,52,45)] text-[rgb(161,188,152)] hover:border-[rgb(119,136,115)]/50 hover:text-[rgb(119,136,115)] hover:bg-[rgb(119,136,115)]/5' : 'border-[rgb(210,220,182)] text-[rgb(119,136,115)] hover:border-[rgb(119,136,115)] hover:text-[rgb(60,68,58)] hover:bg-[rgb(210,220,182)]/30'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${isDarkMode ? 'bg-[rgb(45,52,45)] group-hover:bg-[rgb(119,136,115)]/20' : 'bg-[rgb(210,220,182)] group-hover:bg-[rgb(161,188,152)]'}`}>
                      <Plus size={24} />
                  </div>
                  <span className="font-medium">Create New Project</span>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: WIDGETS (1 col width) */}
          <div className="space-y-6">
            
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
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {members.slice(0, 8).map((member) => (
                      <div key={member.id} className={`flex items-center gap-3 p-2 rounded-lg transition-all ${isDarkMode ? 'hover:bg-[rgb(45,52,45)]/50' : 'hover:bg-[rgb(210,220,182)]/20'}`}>
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
                  {members.length > 8 && (
                    <button className={`w-full mt-3 py-2 text-sm font-medium border-t transition-colors ${isDarkMode ? 'text-[rgb(161,188,152)] hover:text-white border-[rgb(45,52,45)]/50' : 'text-[rgb(119,136,115)] hover:text-[rgb(60,68,58)] border-[rgb(210,220,182)]'}`}>
                      View All {members.length} Members
                    </button>
                  )}
                </>
              )}
            </div>

            {/* TEAM STATS */}
            <div className={`${cardBg} border rounded-xl p-5 transition-all`}>
              <h3 className={`font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>Team Progress</h3>
              <div className="space-y-3">
                <div>
                  <div className={`flex justify-between text-xs mb-1.5 ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
                    <span>Tasks Completed</span>
                    <span className={`font-medium ${isDarkMode ? 'text-[rgb(210,220,182)]' : 'text-[rgb(60,68,58)]'}`}>
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
                  <div className={`flex justify-between text-xs mb-1.5 ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
                    <span>In Progress</span>
                    <span className={`font-medium ${isDarkMode ? 'text-[rgb(210,220,182)]' : 'text-[rgb(60,68,58)]'}`}>
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
        </div>

      </div>
    </div>
  );
}