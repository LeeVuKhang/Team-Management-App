import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Plus, Search, Users, FolderKanban, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import * as teamApi from './services/teamApi';


/**
 * TEAM CARD COMPONENT
 */
const TeamCard = ({ team, darkMode, onClick }) => (
  <div 
    onClick={onClick}
    className={`${darkMode ? 'bg-dark-secondary border-[#308f68]' : 'bg-white border-gray-200 hover:border-gray-400'} 
      border rounded-xl p-3 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] group`}
  >
    {/* Team Name */}
    <div className="mb-4">
      <h3 className={`font-semibold text-lg mb-1 ${darkMode ? 'text-white' : 'text-black'}`}>
        {team.name}
      </h3>
    </div>

    {/* Stats */}
    <div className="flex gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Users size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {team.membersCount} members
        </span>
      </div>
      <div className="flex items-center gap-2">
        <FolderKanban size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {team.activeProjects} projects
        </span>
      </div>
    </div>

    {/* Member Avatars */}
    <div className="flex -space-x-2">
      {team.members.slice(0, 4).map((member, i) => (
        <div 
          key={i}
          className={`inline-block h-8 w-8 rounded-full ring-2 flex items-center justify-center text-xs font-medium transition-all group-hover:scale-110
            ${darkMode ? 'ring-dark-primary bg-[#1F1F1F] text-white' : 'ring-white bg-gray-300 text-black'}`}
        >
          {member}
        </div>
      ))}
      {team.members.length > 4 && (
        <div 
          className={`inline-block h-8 w-8 rounded-full ring-2 flex items-center justify-center text-xs font-medium
            ${darkMode ? 'ring-dark-primary bg-[#171717] text-gray-400' : 'ring-white bg-gray-200 text-gray-600'}`}
        >
          +{team.members.length - 4}
        </div>
      )}
    </div>
  </div>
);

/**
 * MAIN DASHBOARD COMPONENT
 */
export default function Dashboard() {
  const { isDarkMode } = useOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Teams state: load from API on mount. Keep localStorage as a cache/fallback
  const [teams, setTeams] = React.useState([]);
  const [isLoadingTeams, setIsLoadingTeams] = React.useState(true);
  
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isAllTeamsModalOpen, setIsAllTeamsModalOpen] = React.useState(false);
  const [newTeamData, setNewTeamData] = React.useState({
    name: '',
    description: ''
  });

  // Fetch teams from backend, fallback to localStorage/mock if API fails
  React.useEffect(() => {
    let mounted = true;

    async function loadTeams() {
      try {
        const res = await teamApi.getUserTeams();
        if (!mounted) return;
        const apiTeams = (res.data || []).map((t) => ({
          id: t.id,
          name: t.name,
          membersCount: t.total_members || 1,
          activeProjects: t.project_count || 0,
          members: ['YOU'],
          description: t.description || ''
        }));

        setTeams(apiTeams.length ? apiTeams : TEAMS);
        try { localStorage.setItem('teams', JSON.stringify(apiTeams.length ? apiTeams : TEAMS)); } catch(e) { /* ignore */ }
      } catch (err) {
        // If API fails, try localStorage and finally the mock TEAMS
        console.error('Failed to fetch teams:', err);
        const savedTeams = localStorage.getItem('teams');
        setTeams(savedTeams ? JSON.parse(savedTeams) : TEAMS);
      } finally {
        setIsLoadingTeams(false);
      }
    }

    loadTeams();
    return () => { mounted = false; };
  }, []);

  // Save teams to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('teams', JSON.stringify(teams));
  }, [teams]);

  // Filter teams based on search
  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Limit to 7 teams for display, save the 8th slot for "+N" card
  const displayedTeams = filteredTeams.slice(0, 8);
  const remainingTeamsCount = filteredTeams.length - 8;

  const handleTeamClick = (teamId) => {
    navigate(`/teams/${teamId}`);
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();

    if (!newTeamData.name.trim()) {
      toast.error('Team name is required');
      return;
    }

    try {
      const res = await teamApi.createTeam({
        name: newTeamData.name,
        description: newTeamData.description,
      });

      const created = res.data;

      const teamForUI = {
        id: created.id,
        name: created.name,
        membersCount: 1,
        activeProjects: 0,
        members: ['YOU'],
        description: created.description || ''
      };

      setTeams(prev => [...prev, teamForUI]);
      try { localStorage.setItem('teams', JSON.stringify([...teams, teamForUI])); } catch(e) { /* ignore */ }

      // Invalidate sidebar teams cache to refresh "My Teams" list
      queryClient.invalidateQueries({ queryKey: ['userTeams'] });

      toast.success(`Team "${created.name}" created successfully!`);
      setIsModalOpen(false);
      setNewTeamData({ name: '', description: '' });
    } catch (err) {
      console.error('Failed to create team:', err);
      toast.error('Failed to create team. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewTeamData({ name: '', description: '' });
  };

  return (
    <div className="w-full min-h-full flex flex-col max-w-[1200px] mx-auto px-4 lg:px-6 xl:px-10">
      
      {/* Header Section */}
      <div className="pt-12 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Your Teams
            </h1>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all bg-[#006239] hover:bg-[#005230] text-white border border-[#308f68] shadow-lg active:scale-95 whitespace-nowrap"
          >
            <Plus size={18} className="text-[#308f68]" />
            New team
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="py-6">
        <div className="relative w-full md:w-80">
          <Search 
            size={18} 
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} 
          />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-md border text-sm transition-colors
              ${isDarkMode 
                ? 'bg-dark-secondary border-[#171717] text-white placeholder-gray-500 focus:border-gray-700' 
                : 'bg-white border-gray-200 text-black placeholder-gray-400 focus:border-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
        </div>
      </div>

      {/* Teams Grid */}
      <div className="pb-12">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayedTeams.map((team) => (
            <TeamCard 
              key={team.id} 
              team={team} 
              darkMode={isDarkMode}
              onClick={() => handleTeamClick(team.id)}
            />
          ))}
          
          {/* Show "+N more teams" card if there are more than 7 teams */}
          {remainingTeamsCount > 0 && (
            <div 
              onClick={() => setIsAllTeamsModalOpen(true)}
              className={`${isDarkMode ? 'bg-dark-secondary border-[#171717] hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-400'} 
                border rounded-xl p-3 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center min-h-[140px]`}
            >
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  +{remainingTeamsCount}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  more {remainingTeamsCount === 1 ? 'team' : 'teams'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredTeams.length === 0 && (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <p>No teams found matching "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* New Team Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseModal}
          ></div>
          
          {/* Modal */}
          <div className={`relative w-full max-w-md rounded-xl shadow-2xl ${
            isDarkMode ? 'bg-dark-secondary' : 'bg-white'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${
              isDarkMode ? 'border-[#171717]' : 'border-gray-200'
            }`}>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Create New Team
              </h2>
              <button
                onClick={handleCloseModal}
                className={`p-1 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-[#171717] text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTeam} className="px-6 py-5 space-y-4">
              {/* Team Name */}
              <div>
                <label 
                  htmlFor="teamName" 
                  className={`block text-sm font-semibold mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Team Name *
                </label>
                <input
                  type="text"
                  id="teamName"
                  value={newTeamData.name}
                  onChange={(e) => setNewTeamData({ ...newTeamData, name: e.target.value })}
                  placeholder="e.g., Engineering Team"
                  className={`w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-1 ${
                    isDarkMode
                      ? 'bg-dark-primary border-[#171717] text-white placeholder-gray-500 focus:ring-gray-700 focus:border-gray-700'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-gray-900 focus:border-transparent'
                  }`}
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label 
                  htmlFor="teamDescription" 
                  className={`block text-sm font-semibold mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Description <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <textarea
                  id="teamDescription"
                  value={newTeamData.description}
                  onChange={(e) => setNewTeamData({ ...newTeamData, description: e.target.value })}
                  placeholder="What's this team about?"
                  rows={3}
                  className={`w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-1 resize-none ${
                    isDarkMode
                      ? 'bg-dark-primary border-[#171717] text-white placeholder-gray-500 focus:ring-gray-700 focus:border-gray-700'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-gray-900 focus:border-transparent'
                  }`}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                    isDarkMode
                      ? 'bg-dark-primary text-white hover:bg-[#171717]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all bg-[#006239] hover:bg-[#005230] text-white border border-[#308f68] shadow-lg active:scale-95"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* All Teams Modal */}
      {isAllTeamsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsAllTeamsModalOpen(false)}
          ></div>
          
          {/* Modal */}
          <div className={`relative w-full max-w-2xl max-h-[80vh] rounded-xl shadow-2xl overflow-hidden ${
            isDarkMode ? 'bg-dark-secondary' : 'bg-white'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${
              isDarkMode ? 'border-[#171717]' : 'border-gray-200'
            }`}>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                All Teams ({filteredTeams.length})
              </h2>
              <button
                onClick={() => setIsAllTeamsModalOpen(false)}
                className={`p-1 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-[#171717] text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Teams List */}
            <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-4">
              <div className="space-y-3">
                {filteredTeams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => {
                      setIsAllTeamsModalOpen(false);
                      handleTeamClick(team.id);
                    }}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] ${
                      isDarkMode 
                        ? 'bg-dark-primary border-[#308f68]' 
                        : 'bg-white border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className={`font-semibold text-base mb-1 ${
                          isDarkMode ? 'text-white' : 'text-black'
                        }`}>
                          {team.name}
                        </h3>
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Users size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                              {team.membersCount} members
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FolderKanban size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                              {team.activeProjects} projects
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Member Avatars */}
                      <div className="flex -space-x-2 ml-4">
                        {team.members.slice(0, 3).map((member, i) => (
                          <div 
                            key={i}
                            className={`inline-block h-7 w-7 rounded-full ring-2 flex items-center justify-center text-xs font-medium
                              ${isDarkMode ? 'ring-dark-secondary bg-[#1F1F1F] text-white' : 'ring-white bg-gray-300 text-black'}`}
                          >
                            {member}
                          </div>
                        ))}
                        {team.members.length > 3 && (
                          <div 
                            className={`inline-block h-7 w-7 rounded-full ring-2 flex items-center justify-center text-xs font-medium
                              ${isDarkMode ? 'ring-dark-secondary bg-[#171717] text-gray-400' : 'ring-white bg-gray-200 text-gray-600'}`}
                          >
                            +{team.members.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
