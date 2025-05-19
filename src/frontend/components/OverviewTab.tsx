import { useState, useRef } from "react";
import {
  Timetable,
  Teacher,
  Class,
  Scheduler,
  Lesson,
  DAYS,
  PERIODS_PER_DAY,
  exportAllDataToCSV,
  importAllDataFromCSV,
  generateExampleDataFile,
} from "../../util/timetable";
import GradientButton from "./common/GradientButton";
import GradientContainer from "./common/GradientContainer";

interface OverviewTabProps {
  classes: Class[];
  teachers: Teacher[];
  onTimetableGenerated: (timetable: Timetable | null) => void;
  onTeachersChange: (teachers: Teacher[]) => void;
  onClassesChange: (classes: Class[]) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  classes,
  teachers,
  onTimetableGenerated,
  onTeachersChange,
  onClassesChange,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canGenerate =
    classes.length > 0 &&
    teachers.length > 0 &&
    classes.some(cls => cls.lessons.length > 0);

  const handleGenerateTimetable = () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Check if we have enough data to generate a timetable
      if (!canGenerate) {
        throw new Error("Not enough data to generate a timetable");
      }

      // Check if there are any classes with no lessons
      const emptyClasses = classes.filter(cls => cls.lessons.length === 0);
      if (emptyClasses.length > 0) {
        throw new Error(
          `These classes have no lessons: ${emptyClasses.map(c => c.name).join(", ")}`,
        );
      }

      // Make sure all teacher availability is considered
      const totalTeachers = teachers.length;
      const totalClasses = classes.length;
      const totalLessons = classes.reduce(
        (sum, cls) => sum + cls.lessons.length,
        0,
      );
      console.log(
        `Generating timetable with ${totalClasses} classes, ${totalTeachers} teachers, and ${totalLessons} total lessons`,
      );

      // Create deep clones of each class to ensure no cached data is used
      const classesForScheduler = classes.map(cls => {
        // Make sure each lesson references the latest teacher data
        const updatedLessons = cls.lessons.map(lesson => {
          // Find the latest teacher data
          const latestTeacher = teachers.find(
            t => t.name === lesson.teacher.name,
          );
          if (!latestTeacher) {
            console.warn(
              `Teacher ${lesson.teacher.name} not found in latest teacher data. Using cached data.`,
            );
            return lesson;
          }

          // Create a new lesson with updated teacher data
          return new Lesson(lesson.name, latestTeacher, lesson.periodsPerWeek);
        });

        // Return a new class with updated lessons
        return new Class(cls.name, updatedLessons);
      });

      // Create a new scheduler with the updated classes
      const scheduler = new Scheduler(classesForScheduler, 10000);
      const timetable = scheduler.generateTimetable();

      onTimetableGenerated(timetable);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
      onTimetableGenerated(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImportAllData = async (file: File) => {
    try {
      setIsGenerating(true);
      setError(null);
      console.log(
        `Attempting to import file: ${file.name}, size: ${file.size} bytes`,
      );

      const importedData = await importAllDataFromCSV(file);

      // Show stats in console
      console.log(
        `Import successful: ${importedData.teachers.length} teachers, ${importedData.classes.length} classes`,
      );

      // Confirm before replacing data
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
      console.error("Error importing data:", error);
      setError(
        `Import error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      alert(
        "Error importing data. Please check the file format and try again. Check browser console for details.",
      );
    } finally {
      setIsGenerating(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExportAllData = () => {
    exportAllDataToCSV(teachers, classes, "timetable-weaver-data.csv");
  };

  const handleGenerateExampleFile = () => {
    generateExampleDataFile();
  };

  return (
    <div className="mx-auto w-full max-w-5xl p-8">
      <h2 className="mb-8 bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-3xl font-bold text-transparent">
        Overview & Generate
      </h2>

      <GradientContainer className="mb-8 p-8">
        <h3 className="mb-6 flex items-center text-xl font-semibold text-blue-300">
          <span className="mr-3 text-2xl">📊</span> Configurație Curentă
        </h3>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-blue-500/30 bg-blue-300/20 p-5 shadow-lg backdrop-blur-sm transition-transform hover:scale-105 dark:bg-blue-900/10">
            <h4 className="mb-2 flex items-center font-medium text-blue-300">
              <span className="mr-2 text-xl">👨‍🏫</span> Profesori
            </h4>
            <p className="text-3xl font-bold text-blue-200 dark:text-blue-100">
              {teachers.length}
            </p>
          </div>

          <div className="rounded-lg border border-cyan-500/30 bg-cyan-400/10 p-5 shadow-lg backdrop-blur-sm transition-transform hover:scale-105 dark:bg-cyan-900/10">
            <h4 className="mb-2 flex items-center font-medium text-cyan-300">
              <span className="mr-2 text-xl">🏛️</span> Clase
            </h4>
            <p className="text-3xl font-bold text-cyan-400 dark:text-blue-100">
              {classes.length}
            </p>
          </div>

          <div className="rounded-lg border border-indigo-500/30 bg-indigo-400/20 p-5 shadow-lg backdrop-blur-sm transition-transform hover:scale-105">
            <h4 className="mb-2 flex items-center font-medium text-indigo-300">
              <span className="mr-2 text-xl">📚</span> Număr Total Lecții
            </h4>
            <p className="text-3xl font-bold text-indigo-400 dark:text-blue-100">
              {classes.reduce((sum, cls) => sum + cls.lessons.length, 0)}
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={handleGenerateTimetable}
            disabled={!canGenerate || isGenerating}
            className={`relative transform overflow-hidden rounded-xl px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 ${
              !canGenerate || isGenerating
                ? "cursor-not-allowed bg-gray-600"
                : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 hover:shadow-blue-500/30"
            }`}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center">
                <span className="mr-2 animate-spin text-xl">◌</span>
                Generare in curs...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <span className="mr-2">⚙️</span>
                Generare Orar
              </span>
            )}
          </button>

          {!canGenerate && !isGenerating && (
            <p className="mt-4 inline-block rounded-lg bg-red-600/20 p-3 text-sm text-red-400 dark:bg-red-900/20">
              Ai nevoie de cel putin o clasa cu lecții și un profesor pentru a
              genera un orar.
            </p>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-900/20 p-4 text-red-300 backdrop-blur-sm">
              <div className="flex items-center">
                <span className="mr-2 text-xl">⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>
      </GradientContainer>

      <GradientContainer className="mb-8 p-8">
        <h3 className="mb-6 flex items-center text-xl font-semibold text-blue-300">
          <span className="mr-3 text-2xl">💾</span> Management Date
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-purple-500/30 bg-purple-100/10 p-5 backdrop-blur-sm dark:bg-purple-900/10">
            <h4 className="mb-3 font-medium text-purple-400 dark:text-purple-300">
              Importa Date
            </h4>
            <p className="mb-4 text-sm text-purple-300 dark:text-purple-200/70">
              Importă profesori, clase și lecții dintr-un fișier CSV. Acest
              lucru va înlocui datele curente.
            </p>
            <div className="flex flex-col space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleImportAllData(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className="inline-flex transform cursor-pointer items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:from-purple-700 hover:to-indigo-700 hover:shadow-purple-500/20"
              >
                <span className="mr-2">📤</span> Importă Toate Datele
              </label>
              <button
                onClick={handleGenerateExampleFile}
                className="inline-flex items-center justify-center rounded-lg border border-purple-500/30 bg-purple-600/10 px-4 py-2.5 text-sm font-medium text-purple-400 transition-all duration-300 hover:bg-purple-600/20 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-900/40"
              >
                <span className="mr-2">📝</span> Generare Fișier Exemplu
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-teal-500/30 bg-teal-300/10 p-5 backdrop-blur-sm dark:bg-teal-900/10">
            <h4 className="mb-3 font-medium text-teal-400">Exportă Date</h4>
            <p className="mb-4 text-sm text-teal-300 dark:text-teal-200/70">
              Exportă toate datele dumneavoastră (profesori, clase, lecții) în
              fișierul CSV care poate fi importat mai târziu.
            </p>
            <GradientButton
              onClick={handleExportAllData}
              variant="green"
              className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium"
            >
              <span className="mr-2">📥</span> Exportă Toate Datele
            </GradientButton>
          </div>
        </div>
      </GradientContainer>
    </div>
  );
};

export default OverviewTab;
