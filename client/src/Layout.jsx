import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

export default function Layout() {
  const [isDarkMode, setDarkMode] = useState(false);
  const location = useLocation();

  // Determine active page based on route
  const getActivePage = () => {
    if (location.pathname === '/dashboard') return 'dashboard';
    if (location.pathname === '/my-tasks') return 'my-tasks';
    if (location.pathname.includes('/chat')) return 'chat';
    if (location.pathname.includes('/project')) return 'projects';
    return '';
  };

  // Dynamic classes based on theme
  const bgMain = isDarkMode ? 'bg-dark-primary' : 'bg-white';
  const textMain = isDarkMode ? 'text-gray-300' : 'text-gray-900';

  return (
    <div className={`min-h-screen font-sans selection:bg-blue-500/30 transition-colors duration-300 ${bgMain} ${textMain}`}>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Header - Full Width */}
        <Header 
          isDarkMode={isDarkMode} 
          toggleDarkMode={() => setDarkMode(!isDarkMode)}
        />

        {/* Sidebar + Main Content */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar 
            darkMode={isDarkMode} 
            activePage={getActivePage()} 
          />

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            <Outlet context={{ isDarkMode }} />
          </main>
        </div>
      </div>
    </div>
  );
}
