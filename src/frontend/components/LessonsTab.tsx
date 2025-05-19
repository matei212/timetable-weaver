import { useState, useRef } from "react";
import {
  Class,
  Lesson,
  Teacher,
  exportLessonsToCSV,
  importLessonsFromCSV,
  exportClassLessonsToCSV,
} from "../../util/timetable";
import GradientButton from "./common/GradientButton";
import GradientContainer from "./common/GradientContainer";
import TextInput from "./common/TextInput";

interface LessonsTabProps {
  classes: Class[];
  teachers: Teacher[];
  onClassesChange: (classes: Class[]) => void;
}

interface EditingLesson {
  classIndex: number;
  lessonIndex: number;
  name: string;
  teacherIndex: number;
  periodsPerWeek: number;
}

const LessonsTab: React.FC<LessonsTabProps> = ({
  classes,
  teachers,
  onClassesChange,
}) => {
  const [selectedClassIndex, setSelectedClassIndex] = useState<number | null>(
    null,
  );
  const [newLessonName, setNewLessonName] = useState("");
  const [selectedTeacherIndex, setSelectedTeacherIndex] = useState<
    number | null
  >(null);
  const [periodsPerWeek, setPeriodsPerWeek] = useState(1);
  const [editingLesson, setEditingLesson] = useState<EditingLesson | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create refs array for class imports
  const classFileInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Initialize refs for each class
  if (classFileInputRefs.current.length !== classes.length) {
    classFileInputRefs.current = Array(classes.length).fill(null);
  }

  // Create a ref callback for each class input
  const setClassFileInputRef =
    (index: number) => (el: HTMLInputElement | null) => {
      classFileInputRefs.current[index] = el;
    };

  const handleAddLesson = () => {
    if (
      selectedClassIndex !== null &&
      newLessonName.trim() &&
      selectedTeacherIndex !== null &&
      periodsPerWeek > 0
    ) {
      const newLesson = new Lesson(
        newLessonName.trim(),
        teachers[selectedTeacherIndex],
        periodsPerWeek,
      );

      const updatedClasses = [...classes];
      const currentClass = updatedClasses[selectedClassIndex];

      // Create a new class object with the updated lessons array
      updatedClasses[selectedClassIndex] = new Class(currentClass.name, [
        ...currentClass.lessons,
        newLesson,
      ]);

      onClassesChange(updatedClasses);

      // Reset form
      setNewLessonName("");
      setPeriodsPerWeek(1);
    }
  };

  const handleRemoveLesson = (classIndex: number, lessonIndex: number) => {
    const updatedClasses = [...classes];
    const currentClass = updatedClasses[classIndex];
    const updatedLessons = [...currentClass.lessons];

    updatedLessons.splice(lessonIndex, 1);

    // Create a new class object with the updated lessons array
    updatedClasses[classIndex] = new Class(currentClass.name, updatedLessons);

    onClassesChange(updatedClasses);
  };

  const handleStartEditLesson = (classIndex: number, lessonIndex: number) => {
    const lesson = classes[classIndex].lessons[lessonIndex];
    const teacherIndex = teachers.findIndex(
      t => t.name === lesson.teacher.name,
    );

    if (teacherIndex !== -1) {
      setEditingLesson({
        classIndex,
        lessonIndex,
        name: lesson.name,
        teacherIndex,
        periodsPerWeek: lesson.periodsPerWeek,
      });
    }
  };

  const handleSaveEditLesson = () => {
    if (editingLesson && teachers[editingLesson.teacherIndex]) {
      const updatedClasses = [...classes];
      const currentClass = updatedClasses[editingLesson.classIndex];
      const updatedLessons = [...currentClass.lessons];

      updatedLessons[editingLesson.lessonIndex] = new Lesson(
        editingLesson.name.trim(),
        teachers[editingLesson.teacherIndex],
        editingLesson.periodsPerWeek,
      );

      updatedClasses[editingLesson.classIndex] = new Class(
        currentClass.name,
        updatedLessons,
      );

      onClassesChange(updatedClasses);
      setEditingLesson(null);
    }
  };

  const handleCancelEditLesson = () => {
    setEditingLesson(null);
  };

  // Add a new function to handle quick edit of periods per week
  const handleQuickEditPeriodsPerWeek = (
    classIndex: number,
    lessonIndex: number,
    newValue: number,
  ) => {
    const updatedClasses = [...classes];
    const currentClass = updatedClasses[classIndex];
    const lesson = currentClass.lessons[lessonIndex];

    // Create new lesson with updated periods per week
    const updatedLesson = new Lesson(
      lesson.name,
      lesson.teacher,
      Math.max(1, newValue),
    );

    // Update the lesson in the class
    const updatedLessons = [...currentClass.lessons];
    updatedLessons[lessonIndex] = updatedLesson;

    // Create new class with updated lessons
    updatedClasses[classIndex] = new Class(currentClass.name, updatedLessons);

    onClassesChange(updatedClasses);
  };

  // Update the export all lessons handler
  const handleExportAllLessonsToCSV = () => {
    if (classes.length === 0) return;

    // Create CSV header
    let csvContent = "Subject,Teacher,PeriodsPerWeek,Class\r\n";

    // Add data for each class with better class separation
    classes.forEach(cls => {
      // Add class separator before each class except the first
      cls.lessons.forEach(lesson => {
        csvContent += `${lesson.name},${lesson.teacher.name},${lesson.periodsPerWeek},${cls.name}\r\n`;
      });
    });

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = "all-lessons.csv";
    downloadLink.style.display = "none";

    document.body.appendChild(downloadLink);
    downloadLink.click();

    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Add handler for exporting a specific class
  const handleExportClassLessonsToCSV = (classObj: Class) => {
    exportClassLessonsToCSV(classObj);
  };

  // Update the import handler to support class-specific imports
  const handleImportFromCSV = async (
    file: File,
    targetClassName: string | null = null,
  ) => {
    try {
      const updatedClasses = await importLessonsFromCSV(
        file,
        teachers,
        classes,
        targetClassName,
      );
      onClassesChange(updatedClasses);
    } catch (error) {
      console.error("Error importing lessons:", error);
      alert(
        "Eroare la importarea lecțiilor. Vă rugăm verificați fișierul CSV.",
      );
    }
  };

  // Component to display the list of lessons for the selected class
  const ClassLessonsList = ({ classIndex }: { classIndex: number }) => {
    const currentClass = classes[classIndex];
    const lessons = currentClass.lessons;

    if (lessons.length === 0) {
      return (
        <div className="py-8 text-center text-slate-400">
          <p>Nu există lecții adăugate pentru această clasă.</p>
          <p className="mt-2 text-sm">
            Folosiți formularul de mai sus pentru a adăuga lecții.
          </p>
        </div>
      );
    }

    return (
      <div className="mt-8">
        <h4 className="mb-4 flex items-center text-lg font-semibold text-blue-300">
          <span className="mr-2">📚</span> Lecții pentru {currentClass.name}
        </h4>
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-200 dark:bg-slate-700/50 dark:text-slate-200">
                <th className="border-b border-slate-600/50 p-3 text-left font-medium tracking-wide">
                  Materie
                </th>
                <th className="border-b border-slate-600/50 p-3 text-left font-medium tracking-wide">
                  Profesor
                </th>
                <th className="border-b border-slate-600/50 p-3 text-center font-medium tracking-wide">
                  de ore
                </th>
                <th className="hidden w-32 border-b border-slate-600/50 p-3 text-center font-medium tracking-wide md:table-cell">
                  Acțiuni
                </th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson, lessonIndex) => (
                <tr
                  key={lessonIndex}
                  className="border-b border-slate-700/50 transition-all duration-300 hover:bg-slate-400/10 dark:hover:bg-slate-700/20"
                >
                  <td className="p-3">
                    {editingLesson &&
                    editingLesson.classIndex === classIndex &&
                    editingLesson.lessonIndex === lessonIndex ? (
                      <input
                        type="text"
                        value={editingLesson.name}
                        onChange={e =>
                          setEditingLesson({
                            ...editingLesson,
                            name: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-600/50 bg-slate-100 p-2 focus:ring-2 focus:ring-blue-500/50 dark:bg-slate-700/30 dark:text-white"
                        autoFocus
                      />
                    ) : (
                      <div>
                        <span className="font-medium text-slate-700 dark:text-slate-100">
                          {lesson.name}
                        </span>
                        <div className="mt-1 md:hidden">
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() =>
                                handleStartEditLesson(classIndex, lessonIndex)
                              }
                              className="rounded-lg bg-blue-200 px-2 py-1 text-blue-500 transition-all duration-300 hover:bg-blue-300/80 dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/30 dark:hover:text-blue-200"
                            >
                              Editează
                            </button>
                            <button
                              onClick={() =>
                                handleRemoveLesson(classIndex, lessonIndex)
                              }
                              className="rounded-lg bg-red-500/20 px-3 py-1.5 text-red-500 transition-all duration-300 hover:bg-red-500/30 dark:text-red-300 dark:hover:text-red-200"
                            >
                              Șterge
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    {editingLesson &&
                    editingLesson.classIndex === classIndex &&
                    editingLesson.lessonIndex === lessonIndex ? (
                      <select
                        value={editingLesson.teacherIndex}
                        onChange={e =>
                          setEditingLesson({
                            ...editingLesson,
                            teacherIndex: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full rounded-lg border border-slate-600/50 bg-slate-100 p-2 focus:ring-2 focus:ring-blue-500/50 dark:bg-slate-700/30 dark:text-white"
                      >
                        {teachers.map((teacher, idx) => (
                          <option key={idx} value={idx}>
                            {teacher.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-cyan-300">
                          {lesson.teacher.name}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {editingLesson &&
                    editingLesson.classIndex === classIndex &&
                    editingLesson.lessonIndex === lessonIndex ? (
                      <input
                        type="number"
                        min="1"
                        value={editingLesson.periodsPerWeek}
                        onChange={e =>
                          setEditingLesson({
                            ...editingLesson,
                            periodsPerWeek: Math.max(
                              1,
                              parseInt(e.target.value, 10) || 1,
                            ),
                          })
                        }
                        className="w-20 rounded-lg border border-slate-600/50 bg-slate-100 p-2 text-center focus:ring-2 focus:ring-blue-500/50 dark:bg-slate-700/30 dark:text-white"
                      />
                    ) : (
                      <div className="flex justify-center">
                        <input
                          type="number"
                          min="1"
                          value={lesson.periodsPerWeek}
                          onChange={e =>
                            handleQuickEditPeriodsPerWeek(
                              classIndex,
                              lessonIndex,
                              parseInt(e.target.value, 10) || 1,
                            )
                          }
                          className="w-16 rounded-lg border border-blue-500/30 bg-slate-100 p-1 text-center focus:ring-2 focus:ring-blue-500/50 dark:bg-slate-800/50 dark:text-blue-300"
                        />
                      </div>
                    )}
                  </td>
                  <td className="hidden p-3 text-center md:table-cell">
                    {editingLesson &&
                    editingLesson.classIndex === classIndex &&
                    editingLesson.lessonIndex === lessonIndex ? (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={handleSaveEditLesson}
                          className="rounded-lg bg-emerald-600 px-3 py-1 text-xs text-white transition-all duration-300 hover:bg-emerald-700"
                        >
                          Salvează
                        </button>
                        <button
                          onClick={handleCancelEditLesson}
                          className="rounded-lg bg-slate-600 px-3 py-1 text-xs text-white transition-all duration-300 hover:bg-slate-700"
                        >
                          Anulează
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() =>
                            handleStartEditLesson(classIndex, lessonIndex)
                          }
                          className="rounded-lg bg-blue-500/20 px-3 py-1 text-xs text-blue-300 transition-all duration-300 hover:bg-blue-500/30 hover:text-blue-200"
                        >
                          Editează
                        </button>
                        <button
                          onClick={() =>
                            handleRemoveLesson(classIndex, lessonIndex)
                          }
                          className="rounded-lg bg-red-500/20 px-3 py-1 text-xs text-red-300 transition-all duration-300 hover:bg-red-500/30 hover:text-red-200"
                        >
                          Șterge
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl p-8">
      <h2 className="text-gradient-blue mb-4 text-2xl font-bold md:mb-8 md:text-3xl">
        Gestionare Lecții
      </h2>

      {classes.length === 0 ? (
        <GradientContainer className="p-8">
          <div className="flex flex-col items-center justify-center py-8">
            <span className="mb-4 text-4xl">📚</span>
            <p className="mb-2 text-slate-300">
              Nu există clase disponibile. Vă rugăm adăugați clase mai întâi.
            </p>
            <p className="text-sm text-blue-400/80">
              Accesați secțiunea Clase pentru a crea clase înainte de a adăuga
              lecții.
            </p>
          </div>
        </GradientContainer>
      ) : (
        <>
          <GradientContainer className="mb-8 p-8">
            <h3 className="mb-6 flex items-center text-xl font-semibold text-blue-300">
              <span className="mr-3 text-2xl">🏛️</span> Selectați Clasa
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {classes.map((cls, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedClassIndex(index)}
                  className={`rounded-lg border p-4 ${
                    selectedClassIndex === index
                      ? "border-cyan-500/50 bg-blue-600/20 shadow-lg shadow-cyan-500/10 dark:bg-cyan-900/20 dark:text-cyan-100"
                      : "border-slate-600/30 bg-slate-100 text-slate-400 hover:border-slate-500/50 dark:bg-slate-700/30 dark:text-slate-300 dark:hover:bg-slate-700/50"
                  } transform transition-all duration-300 hover:-translate-y-1`}
                >
                  <div className="font-medium">{cls.name}</div>
                  <div className="mt-1 text-sm opacity-80">
                    {cls.lessons.length} lecții, {cls.getTotalPeriodsPerWeek()}{" "}
                    de ore
                  </div>
                </button>
              ))}
            </div>

            {/* Export/Import buttons for all classes */}
            <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-end">
              <GradientButton
                variant="green"
                onClick={handleExportAllLessonsToCSV}
                className="flex items-center justify-center px-4 py-2"
              >
                <span className="mr-2">📥</span>
                <span className="font-medium">Exportă Toate Lecțiile</span>
              </GradientButton>

              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleImportFromCSV(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="import-all-lessons"
              />
              <label
                htmlFor="import-all-lessons"
                className="flex transform cursor-pointer items-center rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/20"
              >
                <span className="mr-2">📤</span>
                <span className="font-medium">Importă Toate Lecțiile</span>
              </label>
            </div>
          </GradientContainer>

          {selectedClassIndex !== null && (
            <GradientContainer className="mb-8 p-8">
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h3 className="flex items-center text-xl font-semibold text-blue-300">
                  <span className="mr-3 text-2xl">📚</span> Adaugă Lecție la{" "}
                  {classes[selectedClassIndex].name}
                </h3>

                <div className="flex flex-wrap gap-3">
                  <input
                    type="file"
                    ref={el => setClassFileInputRef(selectedClassIndex)(el)}
                    accept=".csv"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        handleImportFromCSV(
                          e.target.files[0],
                          classes[selectedClassIndex].name,
                        );
                      }
                    }}
                    className="hidden"
                    id={`import-class-${selectedClassIndex}`}
                  />
                  <label
                    htmlFor={`import-class-${selectedClassIndex}`}
                    className="flex cursor-pointer items-center rounded-lg bg-indigo-500/20 px-3 py-1.5 text-indigo-300 transition-all duration-300 hover:bg-indigo-500/30 hover:text-indigo-200"
                  >
                    <span className="mr-2">📤</span>
                    <span>Importă</span>
                  </label>

                  <button
                    onClick={() =>
                      handleExportClassLessonsToCSV(classes[selectedClassIndex])
                    }
                    className="flex items-center rounded-lg bg-teal-500/20 px-3 py-1.5 text-teal-300 transition-all duration-300 hover:bg-teal-500/30 hover:text-teal-200"
                  >
                    <span className="mr-2">📥</span>
                    <span>Exportă</span>
                  </button>
                </div>
              </div>

              {/* Add Teacher Periods Summary Section */}
              <GradientContainer variant="light" className="mb-6 p-4">
                <h4 className="text-md mb-3 flex items-center font-semibold text-blue-300">
                  <span className="mr-2">👩‍🏫</span> Rezumat de ore Profesori
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {teachers.map(teacher => {
                    // Calculate total periods this teacher has with this class
                    const teacherPeriods = classes[selectedClassIndex].lessons
                      .filter(lesson => lesson.teacher.name === teacher.name)
                      .reduce(
                        (total, lesson) => total + lesson.periodsPerWeek,
                        0,
                      );

                    return (
                      <div
                        key={teacher.name}
                        className={`rounded-lg p-3 ${
                          teacherPeriods > 0
                            ? "border border-blue-500/30 bg-blue-600/10 dark:bg-blue-900/20"
                            : "border border-slate-600/30 bg-slate-300 dark:bg-slate-800/30"
                        } transition-all duration-300`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{teacher.name}</span>
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              teacherPeriods > 0
                                ? "bg-blue-500/30 text-gray-50 dark:text-blue-200"
                                : "bg-slate-700/50 dark:text-slate-400"
                            }`}
                          >
                            {teacherPeriods} de ore
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GradientContainer>

              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-blue-300">
                    Numele Materiei
                  </label>
                  <TextInput
                    value={newLessonName}
                    onChange={e => setNewLessonName(e.target.value)}
                    placeholder="Numele materiei (ex. 'Matematică', 'Fizică')"
                    className="w-full p-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-blue-300">
                    Profesor
                  </label>
                  <select
                    value={
                      selectedTeacherIndex !== null ? selectedTeacherIndex : ""
                    }
                    onChange={e =>
                      setSelectedTeacherIndex(
                        e.target.value ? parseInt(e.target.value, 10) : null,
                      )
                    }
                    className="w-full rounded-lg border border-slate-600/50 bg-slate-100 p-3 backdrop-blur-sm transition-all duration-300 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/50 dark:bg-slate-700/30 dark:text-white"
                  >
                    <option value="">Selectează Profesor</option>
                    {teachers.map((teacher, index) => (
                      <option key={index} value={index}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm text-blue-300">
                  ore pe Săptămână
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={periodsPerWeek}
                    onChange={e =>
                      setPeriodsPerWeek(parseInt(e.target.value, 10))
                    }
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-500 dark:bg-slate-600/50"
                  />
                  <div className="flex h-10 w-12 items-center justify-center rounded-lg border border-blue-500/30 bg-slate-200 dark:bg-blue-900/20 dark:text-blue-300">
                    {periodsPerWeek}
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={handleAddLesson}
                  disabled={
                    !newLessonName.trim() || selectedTeacherIndex === null
                  }
                  className={`relative transform rounded-xl px-6 py-2 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 md:px-8 md:py-3 ${
                    !newLessonName.trim() || selectedTeacherIndex === null
                      ? "cursor-not-allowed bg-gray-600"
                      : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 hover:shadow-blue-500/30"
                  }`}
                >
                  Adaugă Lecție
                </button>
              </div>

              {/* Show list of lessons for this class with ability to edit periods */}
              <ClassLessonsList classIndex={selectedClassIndex} />
            </GradientContainer>
          )}
        </>
      )}
    </div>
  );
};

export default LessonsTab;
