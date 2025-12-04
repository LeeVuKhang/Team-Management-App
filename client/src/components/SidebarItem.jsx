/**
 * Reusable Sidebar Item Component
 */
export default function SidebarItem({ icon: Icon, label, active = false, hasNotification = false, badgeCount = 0, darkMode }) {
  return (
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
}
