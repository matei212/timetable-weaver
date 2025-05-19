import { useEffect, useState } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import GradientButton from "./common/GradientButton";

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
    {
      id: "overview",
      path: "/overview",
      label: "Prezentare generală",
      icon: "📊",
    },
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
      if (window.innerWidth >= 1024) {
        // lg breakpoint in Tailwind
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
          className="rounded-lg bg-blue-600 p-2 text-white shadow-lg transition-all hover:bg-blue-700"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="bg-opacity-50 fixed inset-0 z-40 bg-black lg:hidden"
          onClick={toggleMobileMenu}
        ></div>
      )}

      {/* Sidebar container */}
      <div
        className={`fixed inset-y-0 left-0 z-40 flex transform flex-col bg-white shadow-lg shadow-blue-500/20 backdrop-blur-sm transition-transform duration-300 ease-in-out lg:relative lg:w-72 lg:translate-x-0 dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 dark:text-white ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-blue-500/20 p-6">
          <h1
            className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-2xl font-bold tracking-wider text-transparent"
            onClick={handleCancelTimetable}
          >
            Timetable Weaver
          </h1>
          {mode === "timetable" && (
            <p className="mt-2 flex items-center text-sm font-light text-blue-300">
              <span className="mr-2 animate-pulse text-cyan-400">◉</span>
              Creare Orar Nou
            </p>
          )}
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-3 py-5">
          {tabs.map(tab => (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={({ isActive }) =>
                `group my-1.5 flex items-center rounded-lg p-4 text-left backdrop-blur-sm transition-all duration-300 ease-in-out ${
                  isActive
                    ? "border-l-4 border-blue-400 bg-gradient-to-r from-blue-500/20 to-indigo-500/10 pl-3 text-blue-500 dark:text-white"
                    : "text-blue-300/60 hover:border-l-4 hover:border-blue-500/40 hover:bg-slate-100 hover:pl-3 dark:text-blue-100/70 dark:hover:bg-slate-800/50"
                }`
              }
            >
              <span className="mr-3 text-xl group-hover:animate-pulse">
                {tab.icon}
              </span>
              <span className="font-medium tracking-wide">{tab.label}</span>
            </NavLink>
          ))}
        </div>

        {mode === "timetable" && (
          <div className="border-t border-blue-500/20 p-5">
            <GradientButton
              variant="red"
              onClick={handleCancelTimetable}
              className="w-full px-4 py-3 font-medium"
            >
              Anulează Orarul
            </GradientButton>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
