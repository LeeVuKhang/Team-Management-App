import { useState } from 'react';
import { Search, Bell, Plus, Menu, Sun, Moon, FileText, LogOut, User, HelpCircle } from 'lucide-react';

export default function Header({ isDarkMode, toggleDarkMode, toggleSidebar }) {
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const bgHeader = isDarkMode ? 'bg-[rgb(24,28,24)]/80 border-[rgb(45,52,45)]/50' : 'bg-white/80 border-[rgb(210,220,182)]/50';
  const inputBg = isDarkMode ? 'bg-[rgb(30,36,30)] border-[rgb(45,52,45)] text-[rgb(210,220,182)] placeholder:text-[rgb(119,136,115)]' : 'bg-[rgb(210,220,182)]/30 border-[rgb(161,188,152)] text-[rgb(60,68,58)] placeholder:text-[rgb(119,136,115)]';

  return (
    <header className={`h-20 backdrop-blur-md border-b flex items-center justify-between px-6 sticky top-0 z-10 transition-colors duration-300 ${bgHeader}`}>
      <div className="flex items-center space-x-4">
        <button onClick={toggleSidebar} className={`lg:hidden ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
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
          onClick={toggleDarkMode}
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
  );
}
