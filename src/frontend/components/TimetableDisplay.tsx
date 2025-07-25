import { useState, useEffect } from "react";
import {
  Timetable,
  DAYS,
  PERIODS_PER_DAY,
  getLessonTeacher,
  getLessonName,
  isAlternatingLesson,
} from "../../util/timetable";

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
            const teacher = getLessonTeacher(lesson);

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
    if (!getLessonTeacher(lesson).isAvailable(day, period)) {
      return true;
    }

    // Check if teacher is double-booked
    for (const cls of timetable.classes) {
      if (cls.name === className) continue;

      const otherLesson = timetable.schedule[cls.name][day][period];
      if (
        otherLesson &&
        getLessonTeacher(otherLesson).name === getLessonTeacher(lesson).name
      ) {
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
        className={`rounded-xl border bg-white p-4 shadow-sm ${
          metrics.conflicts > 0
            ? "border-red-200 bg-red-50/30"
            : "border-emerald-200 bg-emerald-50/30"
        }`}
      >
        <div className="flex flex-row items-center justify-between pb-2">
          <span
            className={`text-sm font-medium ${
              metrics.conflicts > 0 ? "text-red-700" : "text-emerald-700"
            }`}
          >
            Conflicte Profesori
          </span>
          <span>
            <svg
              width="20"
              height="20"
              fill="none"
              stroke={metrics.conflicts > 0 ? "#dc2626" : "#16a34a"}
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
        <div
          className={`text-2xl font-bold ${
            metrics.conflicts > 0 ? "text-red-800" : "text-emerald-800"
          }`}
        >
          {metrics.conflicts}
        </div>
        {metrics.conflicts === 0 && (
          <p className="text-xs text-emerald-600">✓ Totul în regulă</p>
        )}
      </div>

      <div
        className={`rounded-xl border bg-white p-4 shadow-sm ${
          metrics.unscheduled > 0
            ? "border-orange-200 bg-orange-50/30"
            : "border-emerald-200 bg-emerald-50/30"
        }`}
      >
        <div className="flex flex-row items-center justify-between pb-2">
          <span
            className={`text-sm font-medium ${
              metrics.unscheduled > 0 ? "text-orange-700" : "text-emerald-700"
            }`}
          >
            Ore Neprogramate
          </span>
          <span>
            <svg
              width="20"
              height="20"
              fill="none"
              stroke={metrics.unscheduled > 0 ? "#ea580c" : "#16a34a"}
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
        <div
          className={`text-2xl font-bold ${
            metrics.unscheduled > 0 ? "text-orange-800" : "text-emerald-800"
          }`}
        >
          {metrics.unscheduled}
        </div>
        {metrics.unscheduled === 0 && (
          <p className="text-xs text-emerald-600">✓ Toate programate</p>
        )}
      </div>

      <div
        className={`rounded-xl border bg-white p-4 shadow-sm ${
          metrics.emptySpaces > 0
            ? "border-red-200 bg-red-50/30"
            : "border-emerald-200 bg-emerald-50/30"
        }`}
      >
        <div className="flex flex-row items-center justify-between pb-2">
          <span
            className={`text-sm font-medium ${
              metrics.emptySpaces > 0 ? "text-red-700" : "text-emerald-700"
            }`}
          >
            Penalizări Spațiu Gol
          </span>
          <span>
            <svg
              width="20"
              height="20"
              fill="none"
              stroke={metrics.emptySpaces > 0 ? "#dc2626" : "#16a34a"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9h6v6H9z" />
            </svg>
          </span>
        </div>
        <div
          className={`text-2xl font-bold ${
            metrics.emptySpaces > 0 ? "text-red-800" : "text-emerald-800"
          }`}
        >
          {metrics.emptySpaces}
        </div>
        {metrics.emptySpaces === 0 && (
          <p className="text-xs text-emerald-600">✓ Fără goluri</p>
        )}
      </div>

      <div
        className={`rounded-xl border bg-white p-4 shadow-sm ${
          metrics.total > 0
            ? "border-yellow-200 bg-yellow-50/30"
            : "border-emerald-200 bg-emerald-50/30"
        }`}
      >
        <div className="flex flex-row items-center justify-between pb-2">
          <span
            className={`text-sm font-medium ${
              metrics.total > 0 ? "text-yellow-700" : "text-emerald-700"
            }`}
          >
            Scor Total
          </span>
          <span>
            <svg
              width="20"
              height="20"
              fill="none"
              stroke={metrics.total > 0 ? "#ca8a04" : "#16a34a"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </span>
        </div>
        <div
          className={`text-2xl font-bold ${
            metrics.total > 0 ? "text-yellow-800" : "text-emerald-800"
          }`}
        >
          {metrics.total}
        </div>
        {metrics.total === 0 && (
          <p className="text-xs text-emerald-600">✓ Perfect!</p>
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
  if (conflictDetails.conflicts === 0) {
    return (
      <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/30 p-4">
        <p className="flex items-center font-medium text-emerald-700">
          <svg
            className="mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
          Nu există conflicte în orar!
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-red-200 bg-red-50/30 p-4">
      <h3 className="mb-2 font-medium text-red-700">
        Conflicte detectate ({conflictDetails.conflicts} total):
      </h3>
      {Object.entries(conflictDetails.teacherConflicts).map(
        ([teacher, count]) => (
          <div key={teacher} className="flex items-center justify-between py-1">
            <span className="text-gray-700">{teacher}</span>
            <span className="font-medium text-red-700">{count} conflicte</span>
          </div>
        ),
      )}
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
  const periodNames = ["1", "2", "3", "4", "5", "6", "7"];

  const hasTeacherAvailabilityConflict = (
    className: string,
    day: number,
    period: number,
  ) => {
    const lesson = timetable.schedule[className][day][period];
    if (!lesson) return false;
    return !getLessonTeacher(lesson).isAvailable(day, period);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
        <svg
          className="mr-2 h-5 w-5 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          ></path>
        </svg>
        Orarul clasei {className}
      </h3>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="border-r border-gray-200 p-3 text-left">
                <span className="font-medium tracking-wide text-gray-700">
                  Time
                </span>
              </th>
              {dayNames.map((day, index) => (
                <th
                  key={index}
                  className="border-r border-gray-200 p-3 text-left font-medium tracking-wide text-gray-700"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periodNames.map((period, periodIndex) => (
              <tr
                key={periodIndex}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                <td className="border-r border-gray-200 bg-gray-50 p-3 font-medium tracking-wide text-gray-700">
                  {period}
                </td>
                {Array.from({ length: DAYS }, (_, dayIndex) => {
                  const lesson =
                    timetable.schedule[className][dayIndex][periodIndex];
                  const isConflict = hasCellConflict(
                    className,
                    dayIndex,
                    periodIndex,
                  );
                  const isAvailabilityConflict = hasTeacherAvailabilityConflict(
                    className,
                    dayIndex,
                    periodIndex,
                  );

                  let cellStyle =
                    "border-r border-gray-200 p-3 transition-all duration-300";
                  if (isConflict) {
                    cellStyle += " bg-red-50";
                  } else if (lesson) {
                    cellStyle += " bg-blue-50";
                  } else {
                    cellStyle += " text-gray-400";
                  }

                  return (
                    <td key={dayIndex} className={cellStyle}>
                      {lesson ? (
                        <div
                          className={`rounded-lg p-2 ${isConflict ? "border border-red-200" : "border border-blue-200"}`}
                        >
                          <div className="mb-1 font-medium text-gray-900">
                            {isAlternatingLesson(lesson)
                              ? `${lesson.names[0]} / ${lesson.names[1]}`
                              : lesson.name}
                            {isAvailabilityConflict && (
                              <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-600">
                                ⚠️ Unavailable
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-sm ${isConflict ? "text-red-600" : "text-blue-600"}`}
                          >
                            {isAlternatingLesson(lesson) ||
                            lesson.type === "group"
                              ? `${lesson.teachers[0].name} / ${lesson.teachers[1].name}`
                              : lesson.teacher.name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Free</span>
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
  const handleExportToPDF = async () => {
    try {
      await timetable.exportToPDF();
    } catch (error) {
      console.error("Error exporting to PDF:", error);
    }
  };

  const handleExportTeacherTimetablesToPDF = async () => {
    try {
      await timetable.exportTeacherTimetablesToPDF();
    } catch (error) {
      console.error("Error exporting teacher timetables:", error);
    }
  };

  const buttonStyle =
    "rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:shadow-sm transform hover:-translate-y-0.5";

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <button
        onClick={onClose}
        className={`${buttonStyle} border border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200`}
      >
        Închide Orarul
      </button>

      <button
        onClick={handleExportToPDF}
        className={`${buttonStyle} bg-blue-600 text-white hover:bg-blue-700`}
      >
        Exportă Orar Clase (PDF)
      </button>

      <button
        onClick={handleExportTeacherTimetablesToPDF}
        className={`${buttonStyle} bg-indigo-600 text-white hover:bg-indigo-700`}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      <div
        onClick={onClose}
        className="ignore-invert fixed h-full w-full cursor-pointer bg-black/70"
      />
      <div className="z-50 m-4 max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Orarul Generat</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <MetricsPanel metrics={metrics} />
        <ConflictDetails conflictDetails={conflictDetails} />
        <TimetableActions onClose={onClose} timetable={timetable} />

        <div className="mb-6">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">
            Selectați Clasa
          </h3>
          <div className="flex flex-wrap gap-2">
            {timetable.classes.map(cls => (
              <button
                key={cls.name}
                onClick={() => setSelectedClass(cls.name)}
                className={`rounded-lg px-4 py-2 transition-all duration-300 ${
                  selectedClass === cls.name
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200"
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
