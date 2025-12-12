import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Plus, Search, Users, FolderKanban } from 'lucide-react';

/**
 * MOCK DATA - Teams
 */
const TEAMS = [
  {
    id: 1,
    name: 'Engineering Team',
    membersCount: 12,
    activeProjects: 8,
    members: ['JD', 'AS', 'MK', 'TR', 'ZR']
  },
  {
    id: 2,
    name: 'Design Team',
    membersCount: 6,
    activeProjects: 4,
    members: ['LP', 'KS', 'RH']
  },
  {
    id: 3,
    name: 'Marketing Team',
    membersCount: 8,
    activeProjects: 5,
    members: ['EM', 'BN', 'CJ', 'DW']
  },
  {
    id: 4,
    name: 'Product Team',
    membersCount: 5,
    activeProjects: 6,
    members: ['FG', 'GH', 'HI']
  },
  {
    id: 5,
    name: 'Sales Team',
    membersCount: 10,
    activeProjects: 3,
    members: ['JK', 'KL', 'LM', 'MN']
  },
  {
    id: 6,
    name: 'Support Team',
    membersCount: 7,
    activeProjects: 2,
    members: ['NO', 'OP', 'PQ']
  }
];

/**
 * TEAM CARD COMPONENT
 */
const TeamCard = ({ team, darkMode, onClick }) => (
  <div 
    onClick={onClick}
    className={`${darkMode ? 'bg-dark-secondary border-[#171717] hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-400'} 
      border rounded-xl p-3 cursor-pointer transition-all hover:shadow-lg group`}
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
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter teams based on search
  const filteredTeams = TEAMS.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTeamClick = (teamId) => {
    navigate(`/teams/${teamId}`);
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
          <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all bg-[#006239] hover:bg-[#005230] text-white border border-[#308f68] shadow-lg active:scale-95 whitespace-nowrap">
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
          {filteredTeams.map((team) => (
            <TeamCard 
              key={team.id} 
              team={team} 
              darkMode={isDarkMode}
              onClick={() => handleTeamClick(team.id)}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredTeams.length === 0 && (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <p>No teams found matching "{searchQuery}"</p>
          </div>
        )}
      </div>

    </div>
  );
}
