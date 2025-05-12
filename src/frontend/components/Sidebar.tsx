import { useEffect, useState } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";

interface SidebarProps {
  mode: "default" | "timetable";
  onModeChange: (mode: "default" | "timetable") => void;
}

interface SidebarTab {
  id: string;
  path: string;
  label: string;
  icon?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ mode, onModeChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const defaultTabs: SidebarTab[] = [
    { id: "home", path: "/", label: "Acasă", icon: "🏠" },
    { id: "about", path: "/about", label: "Despre", icon: "ℹ️" },
  ];

  const timetableTabs: SidebarTab[] = [
    { id: "overview", path: "/overview", label: "Prezentare generală", icon: "📊" },
    { id: "teachers", path: "/teachers", label: "Profesori", icon: "👨‍🏫" },
    { id: "classes", path: "/classes", label: "Clase", icon: "🏛️" },
    { id: "lessons", path: "/lessons", label: "Lecții", icon: "📚" },
  ];

  const tabs = mode === "timetable" ? timetableTabs : defaultTabs;

  // When mode changes, navigate to the first tab of the mode
  useEffect(() => {
    const currentPath = location.pathname;

    // Check if the current path doesn't match any tab in the current mode
    const isPathInTabs = tabs.some(tab => tab.path === currentPath);

    if (!isPathInTabs) {
      // Navigate to the first tab of the current mode
      navigate(tabs[0].path);
    }
  }, [mode, tabs, navigate, location.pathname]);

  // Close mobile menu when navigating to a new page
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle window resize to auto-close mobile menu on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint in Tailwind
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCancelTimetable = () => {
    onModeChange("default");
    navigate("/");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <button 
          onClick={toggleMobileMenu}
          className="p-2 rounded-lg bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleMobileMenu}
        ></div>
      )}

      {/* Sidebar container */}
      <div 
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white shadow-lg shadow-blue-500/20 backdrop-blur-sm transition-transform duration-300 ease-in-out transform lg:translate-x-0 lg:relative lg:w-72 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-blue-500/20 p-6" >

          <h1 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500" onClick={handleCancelTimetable}>
            Timetable Weaver 
          </h1>
          {mode === "timetable" && (
            <p className="mt-2 text-sm font-light text-blue-300/80 flex items-center">
              <span className="mr-2 animate-pulse text-cyan-400">◉</span>
              Creare Orar Nou
              
            </p>
          )}
        </div>

        <div className="flex flex-1 flex-col py-5 px-3 overflow-y-auto">
          {tabs.map(tab => (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={({ isActive }) =>
                `p-4 my-1.5 rounded-lg text-left transition-all duration-300 ease-in-out group
                flex items-center backdrop-blur-sm
                ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/10 text-white border-l-4 border-blue-400 pl-3"
                    : "hover:bg-slate-800/50 hover:border-l-4 hover:border-blue-500/40 hover:pl-3 text-blue-100/70"
                }`
              }
            >
              <span className="mr-3 text-xl group-hover:animate-pulse">{tab.icon}</span>
              <span className="font-medium tracking-wide">{tab.label}</span>
              
            </NavLink>
          ))}
        </div>

        {mode === "timetable" && (
          <div className="border-t border-blue-500/20 p-5">
            <button
              className="w-full rounded-lg bg-gradient-to-r from-red-600 to-pink-600 py-3 px-4 font-medium
                        transition-all duration-300 hover:shadow-lg hover:shadow-red-500/30 transform hover:-translate-y-0.5
                        hover:from-red-700 hover:to-pink-700 backdrop-blur-sm"
              onClick={handleCancelTimetable}
            >
              Anulează Orarul
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
