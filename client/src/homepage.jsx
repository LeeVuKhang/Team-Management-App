import React, { useState } from 'react';
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
  ChevronRight,
  Menu,
  Zap,
  MessageSquare,
  Sun,
  Moon,
  FileText,
  LogOut,
  User,
  HelpCircle
} from 'lucide-react';

/**
 * MOCK DATA
 */
const STATS = [
  { label: 'Total Projects', value: 12, icon: FolderKanban, color: 'bg-blue-500/10 text-blue-500' },
  { label: 'Completed', value: 8, icon: CheckCircle2, color: 'bg-green-500/10 text-green-500' },
  { label: 'Active Tasks', value: 24, icon: LayoutDashboard, color: 'bg-amber-500/10 text-amber-500' },
  { label: 'Overdue', value: 3, icon: AlertCircle, color: 'bg-red-500/10 text-red-500' },
];

const PROJECTS = [
  {
    id: 1,
    title: 'Design Revamp',
    description: 'Redesigning the entire user interface and experience for the core product platform.',
    status: 'Active',
    statusColor: 'text-green-500 bg-green-500/10',
    progress: 75,
    dueDate: 'Dec 25, 2024',
    team: [1, 2, 3]
  },
  {
    id: 2,
    title: 'API Integration',
    description: 'Connecting with third-party payment gateways (Stripe & PayPal).',
    status: 'Active',
    statusColor: 'text-green-500 bg-green-500/10',
    progress: 40,
    dueDate: 'Jan 15, 2025',
    team: [4, 5]
  },
  {
    id: 3,
    title: 'Mobile App Launch',
    description: 'Final preparations for iOS & Android submission including ASO.',
    status: 'Review',
    statusColor: 'text-purple-500 bg-purple-500/10',
    progress: 90,
    dueDate: 'Nov 30, 2024',
    team: [1, 4]
  }
];

const TASKS = [
  { id: 1, title: 'Finalize marketing copy', status: 'Urgent', color: 'text-red-500' },
  { id: 2, title: 'Review PRD document', status: 'In Progress', color: 'text-amber-500' },
  { id: 3, title: 'User testing feedback', status: 'Urgent', color: 'text-red-500' },
  { id: 4, title: 'Update component library', status: 'Done', color: 'text-green-500' },
];

/**
 * COMPONENTS
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

const ProjectCard = ({ project, darkMode }) => (
  <div className={`${darkMode ? 'bg-[rgb(30,36,30)]/50 border-[rgb(45,52,45)]/50' : 'bg-white border-[rgb(210,220,182)] shadow-sm'} border rounded-xl p-5 hover:border-[rgb(161,188,152)] transition-all flex flex-col h-full`}>
    <div className="flex justify-between items-start mb-3">
      <h3 className={`font-semibold text-lg ${darkMode ? 'text-[rgb(241,243,224)]' : 'text-[rgb(60,68,58)]'}`}>{project.title}</h3>
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${project.statusColor}`}>
        {project.status}
      </span>
    </div>
    
    <p className={`${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'} text-sm mb-6 line-clamp-2 flex-grow`}>
      {project.description}
    </p>

    <div className="mt-auto space-y-4">
      <div className="flex -space-x-2 py-2 px-1">
        {project.team.map((_, i) => (
          <div key={i} className="relative group">
            <div className={`inline-block h-8 w-8 rounded-full ring-2 transition-all cursor-pointer group-hover:scale-125 group-hover:z-10 ${darkMode ? 'ring-[rgb(30,36,30)] bg-[rgb(119,136,115)] text-white' : 'ring-white bg-[rgb(210,220,182)] text-[rgb(60,68,58)]'} flex items-center justify-center text-xs font-medium`}>
              {['JD', 'AS', 'MK', 'ZR'][i % 4]}
            </div>
            {/* Online indicator */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-inherit rounded-full"></span>
          </div>
        ))}
        <div className={`inline-block h-8 w-8 rounded-full ring-2 ${darkMode ? 'ring-[rgb(30,36,30)] bg-[rgb(45,52,45)] text-[rgb(161,188,152)]' : 'ring-white bg-[rgb(161,188,152)] text-white'} flex items-center justify-center text-xs font-medium`}>
          +2
        </div>
      </div>

      <div>
        <div className={`flex justify-between text-xs mb-1.5 ${darkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>
          <span>Progress</span>
          <span className={`font-medium ${darkMode ? 'text-[rgb(210,220,182)]' : 'text-[rgb(60,68,58)]'}`}>{project.progress}%</span>
        </div>
        <div className={`w-full rounded-full h-1.5 ${darkMode ? 'bg-[rgb(45,52,45)]' : 'bg-[rgb(210,220,182)]'}`}>
          <div 
            className="bg-[rgb(119,136,115)] h-1.5 rounded-full transition-all duration-500" 
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      </div>

      <div className={`pt-3 border-t flex items-center text-xs ${darkMode ? 'border-[rgb(45,52,45)]/50 text-[rgb(161,188,152)]' : 'border-[rgb(210,220,182)] text-[rgb(119,136,115)]'}`}>
        <Clock size={14} className="mr-1.5" />
        Deadline: <span className={`ml-1 ${darkMode ? 'text-[rgb(210,220,182)]' : 'text-[rgb(60,68,58)]'}`}>{project.dueDate}</span>
      </div>
    </div>
  </div>
);

const AlertWidget = ({ darkMode }) => (
  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start space-x-4">
    <div className="p-2 bg-red-500/20 rounded-lg shrink-0">
      <AlertCircle size={24} className="text-red-500" />
    </div>
    <div>
      <h4 className="text-red-500 font-bold text-lg leading-tight">3 Tasks Overdue</h4>
      <p className={`text-sm mt-1 ${darkMode ? 'text-red-200/70' : 'text-red-600/70'}`}>Please check the styling updates for the mobile app immediately.</p>
      <button className="mt-3 text-xs font-bold text-red-500 hover:text-red-400 flex items-center">
        Review Now <ChevronRight size={14} />
      </button>
    </div>
  </div>
);

/**
 * MAIN APP
 */
export default function Homepage() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setDarkMode] = useState(true); // Default to Dark Mode
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  // Dynamic classes based on theme
  const bgMain = isDarkMode ? 'bg-[rgb(24,28,24)]' : 'bg-[rgb(241,243,224)]';
  const textMain = isDarkMode ? 'text-[rgb(210,220,182)]' : 'text-[rgb(60,68,58)]';
  const bgSidebar = isDarkMode ? 'bg-[rgb(30,36,30)] border-[rgb(45,52,45)]' : 'bg-white border-[rgb(210,220,182)] shadow-sm';
  const bgHeader = isDarkMode ? 'bg-[rgb(24,28,24)]/80 border-[rgb(45,52,45)]/50' : 'bg-white/80 border-[rgb(210,220,182)]/50';
  const inputBg = isDarkMode ? 'bg-[rgb(30,36,30)] border-[rgb(45,52,45)] text-[rgb(210,220,182)] placeholder:text-[rgb(119,136,115)]' : 'bg-[rgb(210,220,182)]/30 border-[rgb(161,188,152)] text-[rgb(60,68,58)] placeholder:text-[rgb(119,136,115)]';
  const cardBg = isDarkMode ? 'bg-[rgb(30,36,30)]/50 border-[rgb(45,52,45)]/50' : 'bg-white border-[rgb(210,220,182)] shadow-sm';
  
  return (
    <div className={`min-h-screen font-sans selection:bg-blue-500/30 transition-colors duration-300 ${bgMain} ${textMain}`}>
      <div className="flex h-screen overflow-hidden">
        
        {/* SIDEBAR */}
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
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active darkMode={isDarkMode} />
            
            {/* NEW CHAT FEATURE */}
            <SidebarItem icon={MessageSquare} label="Messages" darkMode={isDarkMode} badgeCount={3} />
            
            <SidebarItem icon={FolderKanban} label="Projects" darkMode={isDarkMode} />
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
          
          {/* HEADER */}
          <header className={`h-20 backdrop-blur-md border-b flex items-center justify-between px-6 sticky top-0 z-10 transition-colors duration-300 ${bgHeader}`}>
            <div className="flex items-center space-x-4">
              <button onClick={() => setSidebarOpen(!isSidebarOpen)} className={`lg:hidden ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <Menu />
              </button>
              
              {/* CREATE BUTTON */}
              <button className="flex items-center space-x-2 bg-[rgb(119,136,115)] hover:bg-[rgb(161,188,152)] text-white px-4 py-2 rounded-full font-semibold shadow-lg shadow-[rgb(119,136,115)]/20 transition-all active:scale-95">
                <Plus size={18} />
                <span>Create</span>
              </button>
            </div>

            {/* CENTERED SEARCH BAR */}
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
              
              {/* THEME TOGGLE BUTTON */}
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

              {/* AVATAR WITH DROPDOWN */}
              <div className="relative">
                <button 
                  onClick={() => setDropdownOpen(!isDropdownOpen)}
                  className={`h-10 w-10 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all hover:ring-2 hover:ring-[rgb(119,136,115)]/50 ${isDarkMode ? 'bg-[rgb(45,52,45)] border-[rgb(119,136,115)]' : 'bg-[rgb(210,220,182)] border-white shadow-sm'}`}
                >
                  <User size={20} className={isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'} />
                </button>

                {/* DROPDOWN MENU */}
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

          {/* SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
              
              {/* WELCOME */}
              <div className="mb-8">
                <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>Welcome back, Alex! 👋</h1>
                <p className={`${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>Here's what's happening with your projects today.</p>
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
                    <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>Active Projects</h2>
                    <button className="text-sm text-[rgb(119,136,115)] hover:text-[rgb(161,188,152)] font-medium">View All</button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {PROJECTS.map((project) => (
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
                </div>

                {/* RIGHT: WIDGETS (1 col width) */}
                <div className="space-y-6">
                  
                  <AlertWidget darkMode={isDarkMode} />

                  {/* TASKS WIDGET */}
                  <div className={`${cardBg} border rounded-xl p-5 h-fit transition-all`}>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>Today's Priorities</h3>
                      <button className={`p-1 rounded ${isDarkMode ? 'hover:bg-[rgb(45,52,45)] text-[rgb(161,188,152)]' : 'hover:bg-[rgb(210,220,182)]/30 text-[rgb(119,136,115)]'}`}>
                        <MoreVertical size={16} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {TASKS.map((task) => (
                        <div key={task.id} className={`group flex items-center p-3 rounded-lg border border-transparent transition-all cursor-pointer ${isDarkMode ? 'hover:bg-[rgb(45,52,45)]/50 hover:border-[rgb(45,52,45)]' : 'hover:bg-[rgb(210,220,182)]/20 hover:border-[rgb(210,220,182)]'}`}>
                          <div className={`w-2 h-2 rounded-full mr-3 shrink-0 ${task.color}`}></div>
                          <span className={`text-sm font-medium flex-1 truncate ${isDarkMode ? 'text-[rgb(210,220,182)] group-hover:text-white' : 'text-[rgb(60,68,58)] group-hover:text-[rgb(60,68,58)]'}`}>
                            {task.title}
                          </span>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ml-2 ${task.color} ${isDarkMode ? 'bg-[rgb(30,36,30)]/50' : 'bg-[rgb(210,220,182)]/30'}`}>
                            {task.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button className={`w-full mt-5 py-2 text-sm font-medium border-t transition-colors ${isDarkMode ? 'text-[rgb(161,188,152)] hover:text-white border-[rgb(45,52,45)]/50' : 'text-[rgb(119,136,115)] hover:text-[rgb(60,68,58)] border-[rgb(210,220,182)]'}`}>
                      View All 24 Tasks
                    </button>
                  </div>

                  {/* TEAM ACTIVITY */}
                  <div className={`${cardBg} border rounded-xl p-5 transition-all`}>
                    <h3 className={`font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>Team Availability</h3>
                    <div className="flex -space-x-2 py-2 px-1">
                       {[1,2,3,4,5,6].map((_, i) => (
                           <div key={i} className="relative group">
                             <div className={`inline-block h-10 w-10 rounded-full ring-2 flex items-center justify-center text-xs transition-all cursor-pointer group-hover:scale-125 group-hover:z-10 ${isDarkMode ? 'ring-[rgb(30,36,30)] bg-[rgb(119,136,115)] text-white' : 'ring-white bg-[rgb(210,220,182)] text-[rgb(60,68,58)]'}`}>
                                 U{i}
                             </div>
                             {/* Online indicator for first 4 members */}
                             {i < 4 && (
                               <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-inherit rounded-full"></span>
                             )}
                           </div>
                       ))}
                    </div>
                    <p className={`text-xs mt-2 ${isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-[rgb(119,136,115)]'}`}>4 members are currently online.</p>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}