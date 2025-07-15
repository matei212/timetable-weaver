import React, { useMemo, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import ColorButton from "./common/ColorButton";
import GradientButton from "./common/GradientButton";
import {
  exportAllDataToCSV,
  importAllDataFromCSV,
  generateExampleDataFile,
  Scheduler,
} from "../../util/timetable";
import { AdvancedSettingsContext } from "../providers/AdvancedSettings";
import Modal from "./common/Modal";
import { ThemeContext } from "../providers/Theme";

interface OverviewTabProps {
  classes: any[];
  teachers: any[];
  onTimetableGenerated: (timetable: any | null) => void;
  onTeachersChange: (teachers: any[]) => void;
  onClassesChange: (classes: any[]) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  classes,
  teachers,
  onTimetableGenerated,
  onTeachersChange,
  onClassesChange,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stats = useMemo(
    () => ({
      teachers: teachers.length,
      classes: classes.length,
      lessons: classes.reduce((sum, cls) => sum + cls.lessons.length, 0),
      timetables: 0,
    }),
    [teachers, classes],
  );
  const { advancedSettings, updateSettings } = useContext(
    AdvancedSettingsContext,
  );
  const [showAdvancedSettings, setShowAdvancedSettings] = React.useState(false);
  const [settingsDraft, setSettingsDraft] = React.useState(advancedSettings);

  const handleGenerateTimetable = () => {
    if (!classes.length || !teachers.length) {
      alert(
        "You must have at least one class and one teacher to generate a timetable.",
      );
      return;
    }
    try {
      const scheduler = new Scheduler(classes, advancedSettings);
      const timetable = scheduler.generateTimetable();
      onTimetableGenerated(timetable);
    } catch (e) {
      alert("Failed to generate timetable. Check your data and try again.");
      console.error(e);
    }
  };

  const handleImportAllData = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const importedData = await importAllDataFromCSV(file);
      if (
        importedData.teachers.length === 0 &&
        importedData.classes.length === 0
      ) {
        alert(
          "The file contained no valid data. Please use the example file as a template.",
        );
        return;
      }
      const replaceMessage = `Found ${importedData.teachers.length} teachers and ${importedData.classes.length} classes. This will replace all your existing data. Continue?`;
      if (window.confirm(replaceMessage)) {
        onTeachersChange(importedData.teachers);
        onClassesChange(importedData.classes);
        alert("All data imported successfully!");
      }
    } catch (error) {
      alert(
        "Error importing data. Please check the file format and try again. Check browser console for details.",
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExportAllData = () => {
    exportAllDataToCSV(teachers, classes, "timetable-weaver-data.csv");
  };

  const handleAdvancedSettings = () => {
    setSettingsDraft(advancedSettings);
    setShowAdvancedSettings(true);
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setSettingsDraft(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSaveSettings = () => {
    updateSettings(settingsDraft);
    setShowAdvancedSettings(false);
  };

  const handleCancelSettings = () => {
    setShowAdvancedSettings(false);
  };

  const handleGenerateExampleFile = () => {
    generateExampleDataFile();
  };

  // Theme toggle (simple, minimal)
  const [darkMode, setDarkMode] = React.useState(false);
  const toggleTheme = () => setDarkMode(d => !d);

  // Card and button styles
  const card =
    "rounded-xl border bg-white dark:bg-gray-950 p-6 shadow-sm flex flex-col gap-2";
  const statCard =
    "rounded-xl border p-4 flex flex-col gap-1 shadow-sm bg-white dark:bg-gray-950";
  const button =
    "w-full flex items-center justify-start gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800";
  const primaryButton =
    "w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200";

  return (
    <>
      <header className="mb-2 flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <span className="text-xl">📋</span>
          <span className="text-lg font-semibold">Dashboard</span>
        </div>
        <ThemeButton />
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="flex aspect-video flex-col justify-between rounded-xl border bg-gray-50 p-6 dark:bg-gray-900">
            <h2 className="mb-4 text-2xl font-bold">
              Welcome to Timetable Weaver
            </h2>
            <p className="mb-4 text-gray-500 dark:text-gray-400">
              Manage your school's timetables efficiently with our automated
              scheduling system.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleGenerateTimetable}
                className={primaryButton}
              >
                <span className="mr-2">🗓️</span>
                Generate Timetable
              </button>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="flex flex-col gap-1 rounded-xl border-blue-200 bg-blue-50/30 p-4 shadow-sm dark:border-blue-800 dark:bg-blue-950/30">
              <div className="flex flex-row items-center justify-between pb-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Teachers
                </span>
                <span>
                  <svg
                    width="24"
                    height="24"
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
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                {stats.teachers}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Active teaching staff
              </p>
            </div>
            <div className="flex flex-col gap-1 rounded-xl border-cyan-200 bg-cyan-50/30 p-4 shadow-sm dark:border-cyan-800 dark:bg-cyan-950/30">
              <div className="flex flex-row items-center justify-between pb-2">
                <span className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
                  Classes
                </span>
                <span>
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22 10.5V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v3.5" />
                    <path d="M6 20v-6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6" />
                    <rect width="20" height="8" x="2" y="10.5" rx="2" />
                  </svg>
                </span>
              </div>
              <div className="text-2xl font-bold text-cyan-800 dark:text-cyan-200">
                {stats.classes}
              </div>
              <p className="text-xs text-cyan-600 dark:text-cyan-400">
                Total class groups
              </p>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="flex flex-col gap-1 rounded-xl border-indigo-200 bg-indigo-50/30 p-4 shadow-sm dark:border-indigo-800 dark:bg-indigo-950/30">
              <div className="flex flex-row items-center justify-between pb-2">
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  Lessons
                </span>
                <span>
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M2 19.5A2.5 2.5 0 0 1 4.5 17H20" />
                    <path d="M2 6.5A2.5 2.5 0 0 1 4.5 4H20" />
                    <path d="M20 22V2" />
                    <path d="M4.5 22V2" />
                  </svg>
                </span>
              </div>
              <div className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">
                {stats.lessons}
              </div>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">
                Scheduled lessons
              </p>
            </div>
            <div className="flex flex-col gap-1 rounded-xl border-green-200 bg-green-50/30 p-4 shadow-sm dark:border-green-800 dark:bg-green-950/30">
              <div className="flex flex-row items-center justify-between pb-2">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Timetables
                </span>
                <span>
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <rect width="18" height="18" x="3" y="4" rx="2" />
                    <path d="M16 2v4" />
                    <path d="M8 2v4" />
                    <path d="M3 10h18" />
                  </svg>
                </span>
              </div>
              <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                {stats.timetables}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">
                Generated timetables
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className={card}>
            <h3 className="mb-1 text-lg font-bold">Quick Actions</h3>
            <div className="mb-4 text-sm text-gray-400">
              Common tasks and operations
            </div>
            <div className="flex flex-col gap-2">
              <GradientButton
                variant="gray"
                onClick={() => navigate("/teachers")}
                className="flex px-4 py-2 text-sm font-medium text-black"
              >
                <span className="mr-2">
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
                </span>
                <span className="font-medium text-black">Manage Teachers</span>
              </GradientButton>

              <GradientButton
                variant="gray"
                onClick={() => navigate("/classes")}
                className="flex px-4 py-2 text-sm font-medium text-black"
              >
                <span className="mr-2">
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22 10.5V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v3.5" />
                    <path d="M6 20v-6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6" />
                    <rect width="20" height="8" x="2" y="10.5" rx="2" />
                  </svg>
                </span>
                <span className="font-medium text-black">Manage Classes</span>
              </GradientButton>

              <GradientButton
                variant="gray"
                onClick={() => navigate("/lessons")}
                className="flex px-4 py-2 text-sm font-medium text-black"
              >
                <span className="mr-2">
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
                    <path d="M2 19.5A2.5 2.5 0 0 1 4.5 17H20" />
                    <path d="M2 6.5A2.5 2.5 0 0 1 4.5 4H20" />
                    <path d="M20 22V2" />
                    <path d="M4.5 22V2" />
                  </svg>
                </span>
                <span className="font-medium text-black">Manage Lessons</span>
              </GradientButton>
            </div>
          </div>

          <div className={card}>
            <h3 className="mb-1 text-lg font-bold">Data Management</h3>
            <div className="mb-4 text-sm text-gray-400">
              Import and export your data
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="import-file"
              />

              <GradientButton
                variant="gray"
                onClick={handleImportAllData}
                className="flex px-4 py-2 text-sm font-medium text-black"
              >
                <span className="mr-2">
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
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </span>
                <span className="font-medium text-black">Import Data</span>
              </GradientButton>

              <GradientButton
                variant="gray"
                onClick={handleExportAllData}
                className="flex px-4 py-2 text-sm font-medium text-black"
              >
                <span className="mr-2">
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
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </span>
                <span className="font-medium text-black">Export Data</span>
              </GradientButton>

              <GradientButton
                variant="gray"
                onClick={handleAdvancedSettings}
                className="flex px-4 py-2 text-sm font-medium text-black"
              >
                <span className="mr-2">
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
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 12 3.1V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09A1.65 1.65 0 0 0 21 12.1V12a2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </span>
                <span className="font-medium text-black">
                  Advanced Settings
                </span>
              </GradientButton>

              <GradientButton
                variant="gray"
                onClick={handleGenerateExampleFile}
                className="flex px-4 py-2 text-sm font-medium text-black"
              >
                <span className="mr-2">
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
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 9h6v6H9z" />
                  </svg>
                </span>
                <span className="font-medium text-black">
                  Generate Example Data File
                </span>
              </GradientButton>
            </div>
          </div>
        </div>
      </div>
      {showAdvancedSettings && (
        <Modal isOpen={showAdvancedSettings} onClose={handleCancelSettings}>
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-950">
            <h2 className="mb-4 text-lg font-bold">Advanced Settings</h2>
            <form className="flex flex-col gap-3">
              {Object.entries(settingsDraft).map(([key, value]) => (
                <label key={key} className="flex flex-col gap-1 text-sm">
                  <span className="font-medium capitalize">
                    {key.replace(/([A-Z])/g, " $1")}
                  </span>
                  <input
                    type="number"
                    name={key}
                    value={value}
                    onChange={handleSettingsChange}
                    className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                  />
                </label>
              ))}
            </form>
            <div className="mt-6 flex justify-end gap-2">
              <ColorButton variant="gray" onClick={handleCancelSettings}>
                Cancel
              </ColorButton>
              <GradientButton variant="blue" onClick={handleSaveSettings}>
                Save
              </GradientButton>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
export default OverviewTab;

const ThemeButton = () => {
  const { theme, cycleThemes } = useContext(ThemeContext);
  const icon = useMemo(() => {
    switch (theme) {
      case "dark":
        return "🌙";
      case "light":
        return "☀️";
      case "auto":
      default:
        return "💻";
    }
  }, [theme]);

  return (
    <button
      onClick={cycleThemes}
      className="ml-auto flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
    >
      <span>{icon}</span>
      <span className="capitalize">{theme}</span>
    </button>
  );
};
