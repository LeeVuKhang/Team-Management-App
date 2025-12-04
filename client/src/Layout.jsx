import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

export default function Layout() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setDarkMode] = useState(true);
  const location = useLocation();

  // Determine active page based on route
  const getActivePage = () => {
    if (location.pathname === '/') return 'dashboard';
    if (location.pathname.startsWith('/project')) return 'projects';
    return '';
  };

  // Dynamic classes based on theme
  const bgMain = isDarkMode ? 'bg-[rgb(24,28,24)]' : 'bg-[rgb(241,243,224)]';
  const textMain = isDarkMode ? 'text-[rgb(210,220,182)]' : 'text-[rgb(60,68,58)]';

  return (
    <div className={`min-h-screen font-sans selection:bg-blue-500/30 transition-colors duration-300 ${bgMain} ${textMain}`}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} darkMode={isDarkMode} activePage={getActivePage()} />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <Header 
            isDarkMode={isDarkMode} 
            toggleDarkMode={() => setDarkMode(!isDarkMode)}
            toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
          />

          {/* Page Content */}
          <div className="flex-1 overflow-auto">
            <Outlet context={{ isDarkMode }} />
          </div>
        </main>
      </div>
    </div>
  );
}
