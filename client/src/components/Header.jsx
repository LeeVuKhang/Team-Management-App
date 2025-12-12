import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Plus, Menu, Sun, Moon, FileText, LogOut, User, HelpCircle } from 'lucide-react';

export default function Header({ isDarkMode, toggleDarkMode }) {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Navigate to landing page
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

        <button className={`relative p-2 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-inherit"></span>
        </button>
        
        <div className={`h-8 w-[1px] mx-2 ${isDarkMode ? 'bg-[#1F1F1F]' : 'bg-gray-200'}`}></div>

        <div className="relative">
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
