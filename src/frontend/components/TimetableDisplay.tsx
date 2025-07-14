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
      <div className={`rounded-xl border p-4 shadow-sm bg-white dark:bg-gray-950 ${
        metrics.conflicts > 0
          ? "border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-950/30"
          : "border-emerald-200 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/30"
      }`}>
        <div className="flex flex-row items-center justify-between pb-2">
          <span className={`text-sm font-medium ${
            metrics.conflicts > 0
              ? "text-red-700 dark:text-red-300"
              : "text-emerald-700 dark:text-emerald-300"
          }`}>Conflicte Profesori</span>
          <span>
            <svg width="20" height="20" fill="none" stroke={metrics.conflicts > 0 ? "#dc2626" : "#16a34a"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </span>
        </div>
        <div className={`text-2xl font-bold ${
          metrics.conflicts > 0
            ? "text-red-800 dark:text-red-200"
            : "text-emerald-800 dark:text-emerald-200"
        }`}>{metrics.conflicts}</div>
        {metrics.conflicts === 0 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">✓ Totul în regulă</p>
        )}
      </div>

      <div className={`rounded-xl border p-4 shadow-sm bg-white dark:bg-gray-950 ${
        metrics.unscheduled > 0
          ? "border-orange-200 bg-orange-50/30 dark:border-orange-800 dark:bg-orange-950/30"
          : "border-emerald-200 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/30"
      }`}>
        <div className="flex flex-row items-center justify-between pb-2">
          <span className={`text-sm font-medium ${
            metrics.unscheduled > 0
              ? "text-orange-700 dark:text-orange-300"
              : "text-emerald-700 dark:text-emerald-300"
          }`}>Ore Neprogramate</span>
          <span>
            <svg width="20" height="20" fill="none" stroke={metrics.unscheduled > 0 ? "#ea580c" : "#16a34a"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
          </span>
        </div>
        <div className={`text-2xl font-bold ${
          metrics.unscheduled > 0
            ? "text-orange-800 dark:text-orange-200"
            : "text-emerald-800 dark:text-emerald-200"
        }`}>{metrics.unscheduled}</div>
        {metrics.unscheduled === 0 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">✓ Toate programate</p>
        )}
      </div>

      <div className={`rounded-xl border p-4 shadow-sm bg-white dark:bg-gray-950 ${
        metrics.emptySpaces > 0
          ? "border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-950/30"
          : "border-emerald-200 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/30"
      }`}>
        <div className="flex flex-row items-center justify-between pb-2">
          <span className={`text-sm font-medium ${
            metrics.emptySpaces > 0
              ? "text-red-700 dark:text-red-300"
              : "text-emerald-700 dark:text-emerald-300"
          }`}>Penalizări Spațiu Gol</span>
          <span>
            <svg width="20" height="20" fill="none" stroke={metrics.emptySpaces > 0 ? "#dc2626" : "#16a34a"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/></svg>
          </span>
        </div>
        <div className={`text-2xl font-bold ${
          metrics.emptySpaces > 0
            ? "text-red-800 dark:text-red-200"
            : "text-emerald-800 dark:text-emerald-200"
        }`}>{metrics.emptySpaces}</div>
        {metrics.emptySpaces === 0 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">✓ Fără goluri</p>
        )}
      </div>

      <div className={`rounded-xl border p-4 shadow-sm bg-white dark:bg-gray-950 ${
        metrics.total > 0
          ? "border-yellow-200 bg-yellow-50/30 dark:border-yellow-800 dark:bg-yellow-950/30"
          : "border-emerald-200 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/30"
      }`}>
        <div className="flex flex-row items-center justify-between pb-2">
          <span className={`text-sm font-medium ${
            metrics.total > 0
              ? "text-yellow-700 dark:text-yellow-300"
              : "text-emerald-700 dark:text-emerald-300"
          }`}>Scor de Calitate</span>
          <span>
            <svg width="20" height="20" fill="none" stroke={metrics.total > 0 ? "#ca8a04" : "#16a34a"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </span>
        </div>
        <div className={`text-2xl font-bold ${
          metrics.total > 0
            ? "text-yellow-800 dark:text-yellow-200"
            : "text-emerald-800 dark:text-emerald-200"
        }`}>{metrics.total}</div>
        {metrics.total === 0 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">✓ Perfect!</p>
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
      <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
        <p className="flex items-center font-medium text-emerald-700 dark:text-emerald-300">
          <span className="mr-2">✓</span> Nu există conflicte între profesori! Orarul este optimal.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-red-200 bg-red-50/30 p-4 dark:border-red-800 dark:bg-red-950/30">
      <h3 className="mb-2 font-medium text-red-700 dark:text-red-300">
        Au fost detectate {conflictDetails.conflicts} conflicte
      </h3>
      <div className="mt-3 space-y-1">
        {teacherConflicts.map(([teacher, count], index) => (
          <div key={index} className="flex justify-between">
            <span className="text-gray-700 dark:text-gray-300">{teacher}</span>
            <span className="font-medium text-red-700 dark:text-red-300">{count} conflicte</span>
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
      <h3 className="mb-4 text-lg font-semibold flex items-center text-gray-900 dark:text-white">
        <span className="mr-2 text-blue-500">📋</span>
        Class {className}
      </h3>
      <div className="rounded-xl border border-gray-200 bg-white dark:bg-gray-950 dark:border-gray-800 overflow-hidden shadow-sm">
        <table className="w-full min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <th className="border-r border-gray-200 dark:border-gray-800 p-3 text-left">
                <span className="font-medium tracking-wide text-gray-700 dark:text-gray-300">Time</span>
              </th>
              {dayNames.map((day, index) => (
                <th 
                  key={index} 
                  className="border-r border-gray-200 dark:border-gray-800 p-3 text-left font-medium tracking-wide text-gray-700 dark:text-gray-300"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periodNames.map((period, periodIndex) => (
              <tr key={periodIndex} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                <td className="border-r border-gray-200 dark:border-gray-800 p-3 bg-gray-50 dark:bg-gray-900 font-medium text-gray-700 dark:text-gray-300 tracking-wide">
                  {period}
                </td>
                {Array.from({ length: DAYS }, (_, dayIndex) => {
                  const lesson = timetable.schedule[className][dayIndex][periodIndex];
                  const isConflict = hasCellConflict(className, dayIndex, periodIndex);
                  const isAvailabilityConflict = hasTeacherAvailabilityConflict(className, dayIndex, periodIndex);
                  
                  let cellStyle = "border-r border-gray-200 dark:border-gray-800 p-3 transition-all duration-300";
                  if (isConflict) {
                    cellStyle += " bg-red-50 dark:bg-red-950/30";
                  } else if (lesson) {
                    cellStyle += " bg-blue-50 dark:bg-blue-950/30";
                  } else {
                    cellStyle += " text-gray-400 dark:text-gray-500";
                  }
                  
                  return (
                    <td key={dayIndex} className={cellStyle}>
                      {lesson ? (
                        <div className={`rounded-lg p-2 ${isConflict ? 'border border-red-200 dark:border-red-800' : 'border border-blue-200 dark:border-blue-800'}`}>
                          <div className="font-medium mb-1 text-gray-900 dark:text-gray-100">
                            {lesson.name}
                            {isAvailabilityConflict && (
                              <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded-full">
                                ⚠️ Unavailable
                              </span>
                            )}
                          </div>
                          <div className={`text-sm ${isConflict ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
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

  const buttonStyle = "rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:shadow-sm transform hover:-translate-y-0.5";

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <button
        onClick={onClose}
        className={`${buttonStyle} bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800`}
      >
        Închide Orarul
      </button>
      
      <button
        onClick={handleExportToPDF}
        className={`${buttonStyle} bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700`}
      >
        Exportă Orar Clase (PDF)
      </button>
      
      <button
        onClick={handleExportTeacherTimetablesToPDF}
        className={`${buttonStyle} bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700`}
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
      <div className="m-4 max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-950 dark:text-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Orarul Generat
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <MetricsPanel metrics={metrics} />
        <ConflictDetails conflictDetails={conflictDetails} />
        <TimetableActions onClose={onClose} timetable={timetable} />

        <div className="mb-6">
          <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Selectați Clasa</h3>
          <div className="flex flex-wrap gap-2">
            {timetable.classes.map(cls => (
              <button
                key={cls.name}
                onClick={() => setSelectedClass(cls.name)}
                className={`rounded-lg px-4 py-2 transition-all duration-300 ${
                  selectedClass === cls.name
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
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
