import React from "react";
import { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import GradientButton from "./common/GradientButton";

interface SidebarProps {
  mode: "default" | "timetable";
  onModeChange: (mode: "default" | "timetable") => void;
}

interface SidebarTab {
  id: string;
  path: string;
  label: string;
  icon: React.ReactNode;
}

const icons = {
  home: (
    <svg width="20" height="20" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9.5L12 4l9 5.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z"/><path d="M9 22V12h6v10"/></svg>
  ),
  about: (
    <svg width="20" height="20" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
  ),
  overview: (
    <svg width="20" height="20" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
  ),
  teachers: (
    <svg width="20" height="20" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  classes: (
    <svg width="20" height="20" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 10.5V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v3.5"/><path d="M6 20v-6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6"/><rect width="20" height="8" x="2" y="10.5" rx="2"/></svg>
  ),
  lessons: (
    <svg width="20" height="20" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M2 19.5A2.5 2.5 0 0 1 4.5 17H20"/><path d="M2 6.5A2.5 2.5 0 0 1 4.5 4H20"/><path d="M20 22V2"/><path d="M4.5 22V2"/></svg>
  ),
};

const Sidebar: React.FC<SidebarProps> = ({ mode, onModeChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const defaultTabs: SidebarTab[] = [
    { id: "home", path: "/", label: "Home", icon: icons.home },
    { id: "about", path: "/about", label: "About", icon: icons.about },
  ];

  const timetableTabs: SidebarTab[] = [
    { id: "overview", path: "/overview", label: "Overview", icon: icons.overview },
    { id: "teachers", path: "/teachers", label: "Teachers", icon: icons.teachers },
    { id: "classes", path: "/classes", label: "Classes", icon: icons.classes },
    { id: "lessons", path: "/lessons", label: "Lessons", icon: icons.lessons },
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
          className="rounded-lg bg-gray-200 p-2 text-gray-700 shadow-lg transition-all hover:bg-gray-300"
          aria-label="Toggle menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
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
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 shadow-lg transition-transform duration-300 ease-in-out lg:relative lg:w-64 lg:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="border-b border-gray-200 dark:border-gray-800 p-6">
          <h1
            className="text-xl font-bold tracking-wider text-gray-900 dark:text-white"
            onClick={handleCancelTimetable}
          >
            Timetable Weaver
          </h1>
          {mode === "timetable" && (
            <p className="mt-2 flex items-center text-sm font-light text-blue-500">
              <span className="mr-2 animate-pulse text-cyan-400">◉</span>
              New Timetable
            </p>
          )}
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-3 py-5 gap-1">
          {tabs.map(tab => (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={({ isActive }) =>
                `group my-1.5 flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-all duration-200 ${
                  isActive
                    ? "bg-gray-100 dark:bg-gray-900 border-l-4 border-blue-500 text-blue-700 dark:text-blue-200"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 hover:dark:bg-gray-900"
                }`
              }
            >
              <span className="flex items-center justify-center w-6 h-6">{tab.icon}</span>
              <span className="font-medium tracking-wide">{tab.label}</span>
            </NavLink>
          ))}
        </div>

        {mode === "timetable" && (
          <div className="border-t border-gray-200 dark:border-gray-800 p-5">
            <GradientButton
              variant="red"
              onClick={handleCancelTimetable}
              className="w-full px-4 py-3 font-medium"
            >
              Cancel Timetable
            </GradientButton>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
