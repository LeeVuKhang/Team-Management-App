import { LayoutDashboard, FolderKanban, Users, Settings, MessageSquare, Zap } from 'lucide-react';
import SidebarItem from './SidebarItem';

export default function Sidebar({ isOpen, darkMode, activePage }) {
  const bgSidebar = darkMode ? 'bg-[rgb(30,36,30)] border-[rgb(45,52,45)]' : 'bg-white border-[rgb(210,220,182)] shadow-sm';

  return (
    <aside 
      className={`${isOpen ? 'w-64' : 'w-0 -ml-4'} 
      ${bgSidebar} border-r flex flex-col transition-all duration-300 absolute z-20 h-full lg:relative lg:w-64`}
    >
      <div className="p-6 flex items-center space-x-3">
        <div className="w-8 h-8 bg-[rgb(119,136,115)] rounded-lg flex items-center justify-center">
          <span className="font-bold text-white text-lg">Z</span>
        </div>
        <span className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-[rgb(60,68,58)]'}`}>Zomato Inc</span>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-2 mt-2">Main Menu</div>
        <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activePage === 'dashboard'} darkMode={darkMode} />
        <SidebarItem icon={MessageSquare} label="Messages" darkMode={darkMode} badgeCount={3} />
        <SidebarItem icon={FolderKanban} label="Projects" active={activePage === 'projects'} darkMode={darkMode} />
        <SidebarItem icon={Users} label="Team Members" darkMode={darkMode} />
        <SidebarItem icon={Settings} label="Settings" darkMode={darkMode} />

        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-2 mt-8">Pinned Projects</div>
        {['UI/UX Revamp', 'API V2 Migration', 'Q4 Marketing'].map((item, i) => (
          <button key={i} className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${darkMode ? 'text-[rgb(161,188,152)] hover:text-[rgb(210,220,182)] hover:bg-[rgb(45,52,45)]/50' : 'text-[rgb(119,136,115)] hover:text-[rgb(60,68,58)] hover:bg-[rgb(210,220,182)]/30'}`}>
            <span className={`w-2 h-2 rounded-full mr-3 ${['bg-[rgb(119,136,115)]', 'bg-purple-500', 'bg-green-500'][i]}`}></span>
            {item}
          </button>
        ))}
      </nav>

      <div className={`p-4 border-t ${darkMode ? 'border-[rgb(45,52,45)]' : 'border-[rgb(210,220,182)]'}`}>
        <button className={`w-full flex items-center justify-center space-x-2 py-2.5 px-4 border rounded-lg transition-all text-sm font-medium ${darkMode ? 'border-[rgb(45,52,45)] text-[rgb(161,188,152)] hover:bg-[rgb(45,52,45)] hover:text-white' : 'border-[rgb(161,188,152)] text-[rgb(119,136,115)] hover:bg-[rgb(210,220,182)]/30 hover:text-[rgb(60,68,58)]'}`}>
          <Zap size={16} className="text-amber-500" />
          <span>Upgrade Plan</span>
        </button>
      </div>
    </aside>
  );
}
