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
      const totalLessons = classes.reduce((sum, cls) => sum + cls.lessons.length, 0);
      console.log(`Generating timetable with ${totalClasses} classes, ${totalTeachers} teachers, and ${totalLessons} total lessons`);
      
      // Create deep clones of each class to ensure no cached data is used
      const classesForScheduler = classes.map(cls => {
        // Make sure each lesson references the latest teacher data
        const updatedLessons = cls.lessons.map(lesson => {
          // Find the latest teacher data
          const latestTeacher = teachers.find(t => t.name === lesson.teacher.name);
          if (!latestTeacher) {
            console.warn(`Teacher ${lesson.teacher.name} not found in latest teacher data. Using cached data.`);
            return lesson;
          }
          
          // Create a new lesson with updated teacher data
          return new Lesson(
            lesson.name,
            latestTeacher,
            lesson.periodsPerWeek
          );
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
      console.log(`Attempting to import file: ${file.name}, size: ${file.size} bytes`);
      
      const importedData = await importAllDataFromCSV(file);
      
      // Show stats in console
      console.log(`Import successful: ${importedData.teachers.length} teachers, ${importedData.classes.length} classes`);
      
      // Confirm before replacing data
      if (importedData.teachers.length === 0 && importedData.classes.length === 0) {
        alert("The file contained no valid data. Please use the example file as a template.");
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
      setError(`Import error: ${error instanceof Error ? error.message : "Unknown error"}`);
      alert("Error importing data. Please check the file format and try again. Check browser console for details.");
    } finally {
      setIsGenerating(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
      <h2 className="mb-8 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">
        Overview & Generate
      </h2>

      <div className="mb-8 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 p-8 shadow-xl border border-blue-500/20 backdrop-blur-sm">
        <h3 className="mb-6 text-xl font-semibold text-blue-300 flex items-center">
          <span className="mr-3 text-2xl">📊</span> Configurație Curentă
        </h3>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-blue-500/30 bg-blue-900/10 p-5 backdrop-blur-sm transition-transform hover:scale-105 shadow-lg">
            <h4 className="mb-2 font-medium text-blue-300 flex items-center">
              <span className="mr-2 text-xl">👨‍🏫</span> Profesori
            </h4>
            <p className="text-3xl font-bold text-blue-100">
              {teachers.length}
            </p>
          </div>

          <div className="rounded-lg border border-cyan-500/30 bg-cyan-900/10 p-5 backdrop-blur-sm transition-transform hover:scale-105 shadow-lg">
            <h4 className="mb-2 font-medium text-cyan-300 flex items-center">
              <span className="mr-2 text-xl">🏛️</span> Clase
            </h4>
            <p className="text-3xl font-bold text-cyan-100">
              {classes.length}
            </p>
          </div>

          <div className="rounded-lg border border-indigo-500/30 bg-indigo-900/10 p-5 backdrop-blur-sm transition-transform hover:scale-105 shadow-lg">
            <h4 className="mb-2 font-medium text-indigo-300 flex items-center">
              <span className="mr-2 text-xl">📚</span> Număr Total Lecții
            </h4>
            <p className="text-3xl font-bold text-indigo-100">
              {classes.reduce((sum, cls) => sum + cls.lessons.length, 0)}
            </p>
          </div>
        </div>

        <div className="text-center mt-10">
          <button
            onClick={handleGenerateTimetable}
            disabled={!canGenerate || isGenerating}
            className={`relative overflow-hidden rounded-xl px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 transform hover:scale-105 
              ${!canGenerate || isGenerating ? 
                "bg-gray-600 cursor-not-allowed" : 
                "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 hover:shadow-blue-500/30"}`}
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
            <p className="mt-4 text-sm text-red-400 bg-red-900/20 rounded-lg p-3 inline-block">
              Ai nevoie de cel putin o clasa cu lecții și un profesor pentru a genera un orar.
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
      </div>

      <div className="mb-8 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 p-8 shadow-xl border border-blue-500/20 backdrop-blur-sm">
        <h3 className="mb-6 text-xl font-semibold text-blue-300 flex items-center">
          <span className="mr-3 text-2xl">💾</span> Management Date
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-purple-500/30 bg-purple-900/10 p-5 backdrop-blur-sm">
            <h4 className="mb-3 font-medium text-purple-300">Importa Date</h4>
            <p className="mb-4 text-sm text-purple-200/70">
              Importă profesori, clase și lecții dintr-un fișier CSV. Acest lucru va înlocui datele curente.
            </p>
            <div className="flex flex-col space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImportAllData(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:shadow-purple-500/20 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-1"
              >
                <span className="mr-2">📤</span> Importă Toate Datele
              </label>
              <button
                onClick={handleGenerateExampleFile}
                className="inline-flex items-center justify-center rounded-lg border border-purple-500/30 bg-purple-900/20 px-4 py-2.5 text-sm font-medium text-purple-300 hover:bg-purple-900/40 transition-all duration-300"
              >
                <span className="mr-2">📝</span> Generare Fișier Exemplu
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-teal-500/30 bg-teal-900/10 p-5 backdrop-blur-sm">
            <h4 className="mb-3 font-medium text-teal-300">Exportă Date</h4>
            <p className="mb-4 text-sm text-teal-200/70">
              Exportă toate datele dumneavoastră (profesori, clase, lecții) în fișierul CSV care poate fi importat mai târziu.
            </p>
            <button
              onClick={handleExportAllData}
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:shadow-teal-500/20 hover:from-teal-700 hover:to-emerald-700 transition-all duration-300 transform hover:-translate-y-1"
            >
              <span className="mr-2">📥</span> Exportă Toate Datele
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
