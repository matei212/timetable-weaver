import { useCallback, useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import {
  Teacher,
  Class,
  Timetable,
  Availability,
  DAYS,
  PERIODS_PER_DAY,
} from "../util/timetable";
import Sidebar from "./components/Sidebar";
import TimetableDisplay from "./components/TimetableDisplay";
import RouteGuard from "./routes/RouteGuard";
import {
  Home,
  About,
  Teachers,
  Classes,
  Lessons,
  Overview,
  NotFound,
} from "./routes";
import ThemeProvider from "./providers/Theme";

// Type definition for the saved app state
interface AppState {
  sidebarMode: "default" | "timetable";
  teachers: Teacher[];
  classes: Class[];
  generatedTimetable: Timetable | null;
}

/**
 * Custom hook to check if localStorage is available
 */
const useStorageAvailability = () => {
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    try {
      const testKey = "__storage_test__";
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      setIsAvailable(true);
    } catch (e) {
      console.error("localStorage not available:", e);
      setIsAvailable(false);
    }
  }, []);

  return isAvailable;
};

/**
 * Helper function to properly reconstruct Teacher objects
 */
const reconstructTeacher = (teacherData: unknown): Teacher => {
  const t = teacherData as { name: string; availability: { buffer: number[] } };
  // Create availability
  const availability = new Availability(DAYS, PERIODS_PER_DAY);
  if (t.availability && Array.isArray(t.availability.buffer)) {
    availability.buffer = [...t.availability.buffer];
  }

  // Create teacher with proper prototype methods
  return new Teacher(t.name, availability);
};

/**
 * Custom hook to handle local storage operations
 */
const useLocalStorage = (storageAvailable: boolean) => {
  const saveState = useCallback(
    (state: AppState) => {
      if (!storageAvailable) return;

      try {
        console.log("Saving state to localStorage");

        // To avoid saving empty state during initialization
        if (
          state.teachers.length === 0 &&
          state.classes.length === 0 &&
          !state.generatedTimetable
        ) {
          // Only save the UI state, not the empty data
          const uiState = {
            sidebarMode: state.sidebarMode,
          };

          // Check if we already have saved data
          const existingState = localStorage.getItem("timetableWeaverState");
          if (existingState) {
            try {
              const parsedExisting = JSON.parse(existingState);
              // Only save UI state if we have existing data
              if (
                parsedExisting.teachers?.length > 0 ||
                parsedExisting.classes?.length > 0
              ) {
                const mergedState = {
                  ...parsedExisting,
                  ...uiState,
                };
                localStorage.setItem(
                  "timetableWeaverState",
                  JSON.stringify(mergedState),
                );
                console.log("Saved UI state while preserving existing data");
                return;
              }
            } catch (e) {
              // If parsing fails, continue with normal save
            }
          }
        }

        // Normal save with all data
        localStorage.setItem("timetableWeaverState", JSON.stringify(state));
        // Verify data was saved
        const savedData = localStorage.getItem("timetableWeaverState");
        console.log(
          "Saved data size:",
          savedData ? savedData.length : 0,
          "bytes",
        );
      } catch (error) {
        console.error("Error saving state to localStorage:", error);
      }
    },
    [storageAvailable],
  );

  const loadState = useCallback((): Partial<AppState> => {
    if (!storageAvailable) return {};

    try {
      console.log("Attempting to load from localStorage");
      const savedState = localStorage.getItem("timetableWeaverState");
      console.log("Raw saved state:", savedState ? "exists" : "null");

      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (error) {
      console.error("Error loading state from localStorage:", error);
    }

    return {};
  }, [storageAvailable]);

  const clearState = useCallback(() => {
    if (storageAvailable) {
      localStorage.removeItem("timetableWeaverState");
      console.log("Cleared localStorage data");
    }
  }, [storageAvailable]);

  const forceSave = useCallback(
    (state: AppState): boolean => {
      if (!storageAvailable) {
        return false;
      }

      try {
        localStorage.setItem("timetableWeaverState", JSON.stringify(state));
        const savedData = localStorage.getItem("timetableWeaverState");
        return !!savedData;
      } catch (error) {
        console.error("Error during force save:", error);
        return false;
      }
    },
    [storageAvailable],
  );

  return { saveState, loadState, clearState, forceSave };
};

/**
 * State Provider component that handles all application state
 */
const StateProvider: React.FC<{
  children: (props: {
    sidebarMode: "default" | "timetable";
    teachers: Teacher[];
    classes: Class[];
    generatedTimetable: Timetable | null;
    storageAvailable: boolean;
    handleSidebarModeChange: (mode: "default" | "timetable") => void;
    handleCreateTimetable: () => void;
    handleTimetableGenerated: (timetable: Timetable | null) => void;
    handleCloseTimetable: () => void;
    handleClearData: () => void;
    handleForceSave: () => void;
    setTeachers: (teachers: Teacher[]) => void;
    setClasses: (classes: Class[] | ((prev: Class[]) => Class[])) => void;
  }) => React.ReactNode;
}> = ({ children }) => {
  const [sidebarMode, setSidebarMode] = useState<"default" | "timetable">(
    "default",
  );
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [generatedTimetable, setGeneratedTimetable] =
    useState<Timetable | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Check localStorage availability
  const storageAvailable = useStorageAvailability();
  const { saveState, loadState, clearState, forceSave } =
    useLocalStorage(storageAvailable);

  // Set sidebar mode based on route
  useEffect(() => {
    const path = location.pathname;
    if (
      path === "/teachers" ||
      path === "/classes" ||
      path === "/lessons" ||
      path === "/overview"
    ) {
      setSidebarMode("timetable");
    }
  }, [location]);

  // Load state from localStorage on initial render
  useEffect(() => {
    if (!storageAvailable) return;

    try {
      const parsedState = loadState();

      // Reconstruct objects with their methods
      if (parsedState.teachers && Array.isArray(parsedState.teachers)) {
        console.log(`Reconstructing ${parsedState.teachers.length} teachers`);
        const reconstructedTeachers = parsedState.teachers.map((t: unknown) =>
          reconstructTeacher(t),
        );
        setTeachers(reconstructedTeachers);
      }

      // In state rehydration, use getLessonTeacher/getLessonName and object literal for lessons
      if (parsedState.classes && Array.isArray(parsedState.classes)) {
        const reconstructedClasses = parsedState.classes.map((c: unknown) => {
          const classObj = c as { name: string; lessons: unknown[] };
          const lessons = classObj.lessons.map((l: unknown) => {
            const lessonObj = l as {
              name: string;
              teacher: unknown;
              periodsPerWeek: number;
            };
            const teacher = reconstructTeacher(lessonObj.teacher);
            return {
              name: lessonObj.name,
              teacher,
              periodsPerWeek: lessonObj.periodsPerWeek,
              type: "normal" as const,
            };
          });
          return new Class(classObj.name, lessons);
        });
        setClasses(reconstructedClasses);
      }

      if (parsedState.generatedTimetable && parsedState.classes) {
        try {
          const timetableClasses = parsedState.classes.map((c: unknown) => {
            const classObj = c as { name: string; lessons: unknown[] };
            const lessons = classObj.lessons.map((l: unknown) => {
              const lessonObj = l as {
                name: string;
                teacher: unknown;
                periodsPerWeek: number;
              };
              const teacher = reconstructTeacher(lessonObj.teacher);
              return {
                name: lessonObj.name,
                teacher,
                periodsPerWeek: lessonObj.periodsPerWeek,
                type: "normal" as const,
              };
            });
            return new Class(classObj.name, lessons);
          });
          const timetable = new Timetable(timetableClasses);
          if (parsedState.generatedTimetable.schedule) {
            timetable.schedule = parsedState.generatedTimetable.schedule;
            // No need to mutate lesson.teacher directly, as lessons are now plain objects
            // and teacher references are set during reconstruction above.
          }
          setGeneratedTimetable(timetable);
        } catch (err) {
          console.error("Error reconstructing timetable:", err);
        }
      }

      if (parsedState.sidebarMode) {
        console.log("Setting sidebar mode to:", parsedState.sidebarMode);
        setSidebarMode(parsedState.sidebarMode);
      }
    } catch (error) {
      console.error("Error reconstructing state from localStorage:", error);
    }
  }, [storageAvailable, loadState]);

  // Save state to localStorage whenever relevant state changes
  useEffect(() => {
    const stateToSave: AppState = {
      sidebarMode,
      teachers,
      classes,
      generatedTimetable,
    };
    saveState(stateToSave);
  }, [sidebarMode, teachers, classes, generatedTimetable, saveState]);

  // Event handlers
  const handleSidebarModeChange = (mode: "default" | "timetable") => {
    setSidebarMode(mode);
  };

  const handleCreateTimetable = () => {
    setSidebarMode("timetable");
  };

  const handleTimetableGenerated = (timetable: Timetable | null) => {
    setGeneratedTimetable(timetable);
  };

  const handleCloseTimetable = () => {
    setGeneratedTimetable(null);
  };

  const handleClearData = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all data? This cannot be undone.",
      )
    ) {
      clearState();
      setSidebarMode("default");
      setTeachers([]);
      setClasses([]);
      setGeneratedTimetable(null);
      navigate("/");
    }
  };

  const handleForceSave = () => {
    if (!storageAvailable) {
      alert("LocalStorage is not available in your browser");
      return;
    }

    const stateToSave: AppState = {
      sidebarMode,
      teachers,
      classes,
      generatedTimetable,
    };

    const success = forceSave(stateToSave);
    if (success) {
      const savedData = localStorage.getItem("timetableWeaverState");
      alert(
        `Successfully saved ${savedData?.length || 0} bytes to localStorage`,
      );
    } else {
      alert("Failed to save data to localStorage");
    }
  };

  return (
    <>
      {children({
        sidebarMode,
        teachers,
        classes,
        generatedTimetable,
        storageAvailable,
        handleSidebarModeChange,
        handleCreateTimetable,
        handleTimetableGenerated,
        handleCloseTimetable,
        handleClearData,
        handleForceSave,
        setTeachers,
        setClasses,
      })}
    </>
  );
};

/**
 * Routes configuration component
 */
const RoutesConfig: React.FC<{
  sidebarMode: "default" | "timetable";
  teachers: Teacher[];
  classes: Class[];
  storageAvailable: boolean;
  onClearData: () => void;
  onForceSave: () => void;
  onCreateTimetable: () => void;
  onTimetableGenerated: (timetable: Timetable | null) => void;
  setTeachers: (teachers: Teacher[]) => void;
  setClasses: (classes: Class[] | ((prev: Class[]) => Class[])) => void;
}> = ({
  sidebarMode,
  teachers,
  classes,
  storageAvailable,
  onClearData,
  onForceSave,
  onCreateTimetable,
  onTimetableGenerated,
  setTeachers,
  setClasses,
}) => {
  return (
    <ThemeProvider>
      <Routes>
        <Route
          path="/"
          element={
            <Home
              storageAvailable={storageAvailable}
              hasData={teachers.length > 0 || classes.length > 0}
              onClearData={onClearData}
              onForceSave={onForceSave}
              onCreateTimetable={onCreateTimetable}
            />
          }
        />
        <Route path="/about" element={<About />} />

        {/* Timetable creation routes */}
        <Route
          path="/teachers"
          element={
            <RouteGuard
              requiredCondition={sidebarMode === "timetable"}
              redirectPath="/"
            >
              <Teachers
                teachers={teachers}
                classes={classes}
                onTeachersChange={setTeachers}
                onClassesChange={setClasses}
              />
            </RouteGuard>
          }
        />
        <Route
          path="/classes"
          element={
            <RouteGuard
              requiredCondition={sidebarMode === "timetable"}
              redirectPath="/"
            >
              <Classes classes={classes} onClassesChange={setClasses} />
            </RouteGuard>
          }
        />
        <Route
          path="/lessons"
          element={
            <RouteGuard
              requiredCondition={sidebarMode === "timetable"}
              redirectPath="/"
            >
              <Lessons
                classes={classes}
                teachers={teachers}
                onClassesChange={setClasses}
              />
            </RouteGuard>
          }
        />
        <Route
          path="/overview"
          element={
            <RouteGuard
              requiredCondition={sidebarMode === "timetable"}
              redirectPath="/"
            >
              <Overview
                classes={classes}
                teachers={teachers}
                onTimetableGenerated={onTimetableGenerated}
                onTeachersChange={setTeachers}
                onClassesChange={setClasses}
              />
            </RouteGuard>
          }
        />

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ThemeProvider>
  );
};

/**
 * Main layout component for the timetable application
 */
const TimetableLayout: React.FC<{
  sidebarMode: "default" | "timetable";
  generatedTimetable: Timetable | null;
  onSidebarModeChange: (mode: "default" | "timetable") => void;
  onCloseTimetable: () => void;
  children: React.ReactNode;
}> = ({
  sidebarMode,
  generatedTimetable,
  onSidebarModeChange,
  onCloseTimetable,
  children,
}) => {
  return (
    <div className="flex h-screen flex-col overflow-hidden lg:flex-row">
      <Sidebar mode={sidebarMode} onModeChange={onSidebarModeChange} />

      <div className="flex-1 overflow-y-auto bg-gray-100 pt-16 lg:pt-0 dark:bg-gray-900 dark:text-white">
        <div className="mx-auto px-4">{children}</div>
      </div>

      {generatedTimetable && (
        <TimetableDisplay
          timetable={generatedTimetable}
          onClose={onCloseTimetable}
        />
      )}
    </div>
  );
};

/**
 * Main App component
 */
function App() {
  return (
    <StateProvider>
      {({
        sidebarMode,
        teachers,
        classes,
        generatedTimetable,
        storageAvailable,
        handleSidebarModeChange,
        handleCreateTimetable,
        handleTimetableGenerated,
        handleCloseTimetable,
        handleClearData,
        handleForceSave,
        setTeachers,
        setClasses,
      }) => (
        <TimetableLayout
          sidebarMode={sidebarMode}
          generatedTimetable={generatedTimetable}
          onSidebarModeChange={handleSidebarModeChange}
          onCloseTimetable={handleCloseTimetable}
        >
          <RoutesConfig
            sidebarMode={sidebarMode}
            teachers={teachers}
            classes={classes}
            storageAvailable={storageAvailable}
            onClearData={handleClearData}
            onForceSave={handleForceSave}
            onCreateTimetable={handleCreateTimetable}
            onTimetableGenerated={handleTimetableGenerated}
            setTeachers={setTeachers}
            setClasses={setClasses}
          />
        </TimetableLayout>
      )}
    </StateProvider>
  );
}

export default App;
