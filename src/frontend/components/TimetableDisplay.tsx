import { useState, useEffect } from "react";
import { Timetable, DAYS, PERIODS_PER_DAY } from "../../util/timetable";
import backend from "../services/backend"; // Import our new browser-compatible backend

interface TimetableDisplayProps {
  timetable: Timetable;
  onClose: () => void;
}

/**
 * Custom hook for timetable analysis and conflict detection
 */
const useTimetableAnalysis = (timetable: Timetable) => {
  const [conflictDetails, setConflictDetails] = useState<{
    conflicts: number;
    teacherConflicts: { [key: string]: number };
  }>({
    conflicts: 0,
    teacherConflicts: {},
  });

  useEffect(() => {
    // Calculate detailed conflict information on component mount
    calculateDetailedConflicts();
  }, [timetable]);

  const calculateDetailedConflicts = () => {
    const teacherConflictMap: { [key: string]: number } = {};
    let totalConflicts = 0;

    // Check for teacher double-booking and availability conflicts
    for (let day = 0; day < DAYS; day++) {
      for (let period = 0; period < PERIODS_PER_DAY; period++) {
        const teacherUsage: { [key: string]: number } = {};

        // Count teachers in this time slot
        for (const cls of timetable.classes) {
          const lesson = timetable.schedule[cls.name][day][period];
          if (lesson) {
            const teacher = lesson.teacher;

            // Check teacher availability
            if (!teacher.isAvailable(day, period)) {
              totalConflicts++;
              teacherConflictMap[teacher.name] =
                (teacherConflictMap[teacher.name] || 0) + 1;
            }

            // Count teachers for double-booking
            teacherUsage[teacher.name] = (teacherUsage[teacher.name] || 0) + 1;
          }
        }

        // Count double-bookings as conflicts
        for (const [teacherName, count] of Object.entries(teacherUsage)) {
          if (count > 1) {
            teacherConflictMap[teacherName] =
              (teacherConflictMap[teacherName] || 0) + (count - 1);
            totalConflicts += count - 1;
          }
        }
      }
    }

    setConflictDetails({
      conflicts: totalConflicts,
      teacherConflicts: teacherConflictMap,
    });
  };

  const getMetrics = () => {
    const conflicts = timetable.countTeacherConflicts();
    const unscheduled = timetable.countUnscheduledPeriods();
    const emptySpaces = timetable.countEmptySpacePenalty();

    return {
      conflicts,
      unscheduled,
      emptySpaces,
      total: conflicts + unscheduled + emptySpaces,
    };
  };

  // Check if a specific cell has a conflict
  const hasCellConflict = (className: string, day: number, period: number) => {
    const lesson = timetable.schedule[className][day][period];
    if (!lesson) return false;

    // Check if teacher is available at this time
    if (!lesson.teacher.isAvailable(day, period)) {
      return true;
    }

    // Check if teacher is double-booked
    for (const cls of timetable.classes) {
      if (cls.name === className) continue;

      const otherLesson = timetable.schedule[cls.name][day][period];
      if (otherLesson && otherLesson.teacher.name === lesson.teacher.name) {
        return true;
      }
    }

    return false;
  };

  return {
    metrics: getMetrics(),
    conflictDetails,
    hasCellConflict,
  };
};

/**
 * Component for displaying quality metrics
 */
const MetricsPanel: React.FC<{
  metrics: ReturnType<typeof useTimetableAnalysis>["metrics"];
}> = ({ metrics }) => {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
      <div
        className={`rounded-lg border backdrop-blur-sm p-5 shadow-lg transition-all duration-300 hover:shadow-xl transform hover:scale-105 ${
          metrics.conflicts > 0
            ? "border-red-500/30 bg-red-900/20"
            : "border-emerald-500/30 bg-emerald-900/20"
        }`}
      >
        <h4 className="mb-2 font-medium tracking-wide">Conflicte Profesori</h4>
        <p
          className={`text-2xl font-bold ${
            metrics.conflicts > 0
              ? "text-red-500 dark:text-red-400"
              : "text-emerald-500 dark:text-emerald-400"
          }`}
        >
          {metrics.conflicts}
        </p>
        {metrics.conflicts === 0 && (
          <span className="mt-1 text-xs text-emerald-500/70">✓ Totul în regulă</span>
        )}
      </div>

      <div
        className={`rounded-lg border backdrop-blur-sm p-5 shadow-lg transition-all duration-300 hover:shadow-xl transform hover:scale-105 ${
          metrics.unscheduled > 0
            ? " border-orange-500/30 bg-orange-900/20"
            : "border-emerald-400/30 bg-emerald-900/10 dark:border-emerald-500/30 dark:bg-emerald-900/20"
        }`}
      >
        <h4 className="mb-2 font-medium tracking-wide">Ore Neprogramate</h4>
        <p
          className={`text-2xl font-bold ${
            metrics.unscheduled > 0
              ? "text-orange-500 dark:text-orange-400"
              : "text-emerald-500 dark:text-emerald-400"
          }`}
        >
          {metrics.unscheduled}
        </p>
        {metrics.unscheduled === 0 && (
          <span className="mt-1 text-xs text-emerald-500/70">✓ Toate programate</span>
        )}
      </div>

      <div
        className={`rounded-lg border backdrop-blur-sm p-5 shadow-lg transition-all duration-300 hover:shadow-xl transform hover:scale-105 ${
          metrics.emptySpaces > 0
            ? "border-red-400/30 bg-red-900/10 dark:border-red-500/30 dark:bg-red-900/20"
            : "border-emerald-400/30 bg-emerald-900/10 dark:border-emerald-500/30 dark:bg-emerald-900/20"
        }`}
      >
        <h4 className="mb-2 font-medium tracking-wide">Penalizări Spațiu Gol</h4>
        <p
          className={`text-2xl font-bold ${
            metrics.emptySpaces > 0
              ? "text-red-500 dark:text-red-400"
              : "text-emerald-500 dark:text-emerald-400"
          }`}
        >
          {metrics.emptySpaces}
        </p>
        {metrics.emptySpaces === 0 && (
          <span className="mt-1 text-xs text-emerald-500/70">✓ Fără goluri</span>
        )}
      </div>

      <div
        className={`rounded-lg border backdrop-blur-sm p-5 shadow-lg transition-all duration-300 hover:shadow-xl transform hover:scale-105 ${
          metrics.total > 0
            ? "border-yellow-400/30 bg-yellow-900/10 dark:border-yellow-500/30 dark:bg-yellow-900/20"
            : "border-emerald-400/30 bg-emerald-900/10 dark:border-emerald-500/30 dark:bg-emerald-900/20"
        }`}
      >
        <h4 className="mb-2 font-medium tracking-wide">Scor de Calitate</h4>
        <p
          className={`text-2xl font-bold ${
            metrics.total > 0
              ? "text-yellow-500 dark:text-yellow-400"
              : "text-emerald-500 dark:text-emerald-400"
          }`}
        >
          {metrics.total}
        </p>
        {metrics.total === 0 && (
          <span className="mt-1 text-xs text-emerald-500/70">✓ Perfect!</span>
        )}
      </div>
    </div>
  );
};

/**
 * Component for displaying conflict details
 */
const ConflictDetails: React.FC<{
  conflictDetails: ReturnType<typeof useTimetableAnalysis>["conflictDetails"];
}> = ({ conflictDetails }) => {
  const hasConflicts = conflictDetails.conflicts > 0;
  const teacherConflicts = Object.entries(conflictDetails.teacherConflicts).sort(
    (a, b) => b[1] - a[1]
  );

  if (!hasConflicts) {
    return (
      <div className="mb-6 rounded-lg border border-green-400/30 bg-green-900/10 p-4 dark:border-green-500/30 dark:bg-green-900/20">
        <p className="flex items-center font-medium text-green-400">
          <span className="mr-2">✓</span> Nu există conflicte între profesori! Orarul este optimal.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-lg border border-red-400/30 bg-red-900/10 p-4 dark:border-red-500/30 dark:bg-red-900/20">
      <h3 className="mb-2 font-medium text-red-400">
        Au fost detectate {conflictDetails.conflicts} conflicte
      </h3>
      <div className="mt-3 space-y-1">
        {teacherConflicts.map(([teacher, count], index) => (
          <div key={index} className="flex justify-between">
            <span>{teacher}</span>
            <span className="font-medium text-red-400">{count} conflicte</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Component for displaying a single class timetable
 */
const ClassTimetable: React.FC<{
  className: string;
  timetable: Timetable;
  hasCellConflict: (className: string, day: number, period: number) => boolean;
}> = ({ className, timetable, hasCellConflict }) => {
  const dayNames = ["Luni", "Marți", "Miercuri", "Joi", "Vineri"];
  const periodNames = Array.from(
    { length: PERIODS_PER_DAY },
    (_, i) => `Period ${i + 1}`,
  );

  // Helper function to check if a teacher is scheduled when unavailable
  const hasTeacherAvailabilityConflict = (className: string, day: number, period: number) => {
    const lesson = timetable.schedule[className][day][period];
    if (!lesson) return false;
    
    return !lesson.teacher.isAvailable(day, period);
  };

  return (
    <div className="mb-8 overflow-x-auto">
      <h3 className="mb-4 text-lg font-semibold flex items-center">
        <span className="mr-2 text-blue-500">📋</span>
        Class {className}
      </h3>
      <div className="rounded-lg border border-blue-400/20 bg-blue-900/5 backdrop-blur-sm overflow-hidden shadow-lg">
        <table className="w-full min-w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 text-blue-100">
              <th className="border-b border-r border-blue-400/20 p-3 text-left">
                <span className="font-medium tracking-wide">Time</span>
              </th>
              {dayNames.map((day, index) => (
                <th 
                  key={index} 
                  className="border-b border-r border-blue-400/20 p-3 text-left font-medium tracking-wide"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periodNames.map((period, periodIndex) => (
              <tr key={periodIndex} className="border-b border-blue-400/20 hover:bg-blue-900/10">
                <td className="border-r border-blue-400/20 p-3 bg-blue-900/20 font-medium text-blue-200 tracking-wide">
                  {period}
                </td>
                {Array.from({ length: DAYS }, (_, dayIndex) => {
                  const lesson = timetable.schedule[className][dayIndex][periodIndex];
                  const isConflict = hasCellConflict(className, dayIndex, periodIndex);
                  const isAvailabilityConflict = hasTeacherAvailabilityConflict(className, dayIndex, periodIndex);
                  
                  // Determine cell styling based on conflicts
                  let cellStyle = "border-r border-blue-400/20 p-3 transition-all duration-300";
                  if (isConflict) {
                    cellStyle += " bg-red-900/20 text-red-100";
                  } else if (lesson) {
                    cellStyle += " bg-blue-900/10 text-blue-100";
                  } else {
                    cellStyle += " text-gray-400 dark:text-gray-500";
                  }
                  
                  return (
                    <td key={dayIndex} className={cellStyle}>
                      {lesson ? (
                        <div className={`rounded-md p-1.5 ${isConflict ? 'border border-red-500/50' : 'border border-blue-500/30'}`}>
                          <div className="font-medium mb-1">
                            {lesson.name}
                            {isAvailabilityConflict && (
                              <span className="ml-2 text-xs text-yellow-300 bg-yellow-500/20 px-2 py-0.5 rounded-full">
                                ⚠️ Unavailable
                              </span>
                            )}
                          </div>
                          <div className={`text-sm ${isConflict ? 'text-red-300/80' : 'text-blue-300/80'}`}>
                            {lesson.teacher.name}
                          </div>
                        </div>
                      ) : (
                        <span className="italic text-gray-400 dark:text-gray-500">Free</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Actions panel for timetable
 */
const TimetableActions: React.FC<{
  onClose: () => void;
  timetable: Timetable;
}> = ({ onClose, timetable }) => {
  const [exportStatus, setExportStatus] = useState<
    "idle" | "exporting" | "success" | "error"
  >("idle");
  const [exportType, setExportType] = useState<"timetable" | "teachers">("timetable");

  const handleExportToPDF = async () => {
    try {
      setExportType("timetable");
      setExportStatus("exporting");
      await timetable.exportToPDF();
      setExportStatus("success");
      setTimeout(() => setExportStatus("idle"), 2000);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      setExportStatus("error");
      setTimeout(() => setExportStatus("idle"), 2000);
    }
  };

  const handleExportTeacherTimetablesToPDF = async () => {
    try {
      setExportType("teachers");
      setExportStatus("exporting");
      await timetable.exportTeacherTimetablesToPDF();
      setExportStatus("success");
      setTimeout(() => setExportStatus("idle"), 2000);
    } catch (error) {
      console.error("Error exporting teacher timetables:", error);
      setExportStatus("error");
      setTimeout(() => setExportStatus("idle"), 2000);
    }
  };

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <button
        onClick={onClose}
        className="rounded-lg bg-gradient-to-r from-slate-500 to-slate-600 px-4 py-2 font-medium text-white shadow-lg transition-all duration-300 hover:from-slate-600 hover:to-slate-700 hover:shadow-slate-500/20 transform hover:-translate-y-0.5"
      >
        Închide Orarul
      </button>
      
      <button
        onClick={handleExportToPDF}
        className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 font-medium text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/20 transform hover:-translate-y-0.5"
      >
        Exportă Orar Clase (PDF)
      </button>
      
      <button
        onClick={handleExportTeacherTimetablesToPDF}
        className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 font-medium text-white shadow-lg transition-all duration-300 hover:from-purple-700 hover:to-indigo-700 hover:shadow-purple-500/20 transform hover:-translate-y-0.5"
      >
        Exportă Orar Profesori (PDF)
      </button>
    </div>
  );
};

/**
 * Main component for displaying the generated timetable
 */
const TimetableDisplay: React.FC<TimetableDisplayProps> = ({
  timetable,
  onClose,
}) => {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const { metrics, conflictDetails, hasCellConflict } =
    useTimetableAnalysis(timetable);

  useEffect(() => {
    // Select the first class by default
    if (timetable.classes.length > 0 && !selectedClass) {
      setSelectedClass(timetable.classes[0].name);
    }
  }, [timetable, selectedClass]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 backdrop-blur-sm">
      <div className="m-4 max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:text-white">
        <h2 className="mb-6 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Orarul Generat
        </h2>

        <MetricsPanel metrics={metrics} />
        <ConflictDetails conflictDetails={conflictDetails} />
        <TimetableActions onClose={onClose} timetable={timetable} />

        <div className="mb-6">
          <h3 className="mb-3 text-lg font-semibold">Selectați Clasa</h3>
          <div className="flex flex-wrap gap-2">
            {timetable.classes.map(cls => (
              <button
                key={cls.name}
                onClick={() => setSelectedClass(cls.name)}
                className={`rounded-lg px-4 py-2 transition-all duration-300 ${
                  selectedClass === cls.name
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {cls.name}
              </button>
            ))}
          </div>
        </div>

        {selectedClass && (
          <ClassTimetable
            className={selectedClass}
            timetable={timetable}
            hasCellConflict={hasCellConflict}
          />
        )}
      </div>
    </div>
  );
};

export default TimetableDisplay;
