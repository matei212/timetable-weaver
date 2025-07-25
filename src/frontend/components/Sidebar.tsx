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
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="#2563eb"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M3 9.5L12 4l9 5.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" />
      <path d="M9 22V12h6v10" />
    </svg>
  ),
  about: (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="#64748b"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  overview: (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="#2563eb"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  teachers: (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="#2563eb"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  classes: (
    <svg
      className="h-6 w-6 text-gray-800 dark:text-white"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke="#06b6d4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M8 20v-9l-4 1.125V20h4Zm0 0h8m-8 0V6.66667M16 20v-9l4 1.125V20h-4Zm0 0V6.66667M18 8l-6-4-6 4m5 1h2m-2 3h2"
      />
    </svg>
  ),
  lessons: (
    <svg
      className="h-6 w-6 text-gray-800 dark:text-white"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke="#6366f1"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="m17 21-5-4-5 4V3.889a.92.92 0 0 1 .244-.629.808.808 0 0 1 .59-.26h8.333a.81.81 0 0 1 .589.26.92.92 0 0 1 .244.63V21Z"
      />
    </svg>
  ),
};

const Sidebar: React.FC<SidebarProps> = ({ mode, onModeChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const defaultTabs: SidebarTab[] = [
    { id: "home", path: "/", label: "Acasă", icon: icons.home },
    { id: "about", path: "/about", label: "Despre", icon: icons.about },
    {
      id: "login",
      path: "/login",
      label: "Login",
      icon: (
        <svg
          width="20"
          height="20"
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
      ),
    },
    {
      id: "signup",
      path: "/signup",
      label: "Sign Up",
      icon: (
        <svg
          width="20"
          height="20"
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
    },
  ];

  const timetableTabs: SidebarTab[] = [
    {
      id: "overview",
      path: "/overview",
      label: "Prezentare generală",
      icon: icons.overview,
    },
    {
      id: "teachers",
      path: "/teachers",
      label: "Profesori",
      icon: icons.teachers,
    },
    { id: "classes", path: "/classes", label: "Clase", icon: icons.classes },
    { id: "lessons", path: "/lessons", label: "Lecții", icon: icons.lessons },
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
      <div className="fixed top-4 left-4 z-30 lg:hidden">
        <button
          onClick={toggleMobileMenu}
          className="rounded-lg bg-gray-200 p-2 text-gray-700 shadow-lg transition-all hover:bg-gray-300"
          aria-label="Toggle menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="h-6 w-6"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="ignore-invert fixed inset-0 z-10 bg-black/70 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar container */}
      <div
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-200 bg-white shadow-lg transition-transform duration-300 ease-in-out lg:relative lg:w-64 lg:translate-x-0 dark:border-gray-800 dark:bg-gray-950 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="border-b border-gray-200 p-6 dark:border-gray-800">
          <h1
            className="text-xl font-bold tracking-wider text-gray-900 dark:text-white"
            onClick={handleCancelTimetable}
          >
            Timetable Weaver
          </h1>
          {mode === "timetable" && (
            <p className="mt-2 flex items-center text-sm font-light text-blue-500">
              <span className="mr-2 animate-pulse text-cyan-400">◉</span>
              Orar Nou
            </p>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-5">
          {tabs.map(tab => (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={({ isActive }) =>
                `group my-1.5 flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-all duration-200 ${
                  isActive
                    ? "border-l-4 border-blue-500 bg-gray-100 text-blue-700 dark:bg-gray-900 dark:text-blue-200"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 hover:dark:bg-gray-900"
                }`
              }
            >
              <span className="flex h-6 w-6 items-center justify-center">
                {tab.icon}
              </span>
              <span className="font-medium tracking-wide">{tab.label}</span>
            </NavLink>
          ))}
        </div>

        {mode === "timetable" && (
          <div className="border-t border-gray-200 p-5 dark:border-gray-800">
            <GradientButton
              variant="red"
              onClick={handleCancelTimetable}
              className="w-full px-4 py-3 font-medium"
            >
              Anulează orarul
            </GradientButton>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
