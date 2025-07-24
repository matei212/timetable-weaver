import { useState, useRef, useMemo } from "react";
import ThemeButton from "./common/ThemeButton";
import {
  Class,
  Lesson,
  Teacher,
  importLessonsFromCSV,
  exportClassLessonsToCSV,
  getLessonName,
  getLessonTeacher,
  isAlternatingLesson,
  getAllTeachers,
  exportAllLessonsToCSV,
} from "../../util/timetable";
import GradientButton from "./common/GradientButton";
import GradientContainer from "./common/GradientContainer";
import TextInput from "./common/TextInput";
import ColorButton from "./common/ColorButton";
import { SiGoogleclassroom } from "react-icons/si";
import { MdOutlineLibraryBooks } from "react-icons/md";
import { MdOutlineSummarize } from "react-icons/md";

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

  // Add state for lesson type and alternating fields
  const [lessonType, setLessonType] = useState<"normal" | "alternating">(
    "normal",
  );
  const [altLessonNames, setAltLessonNames] = useState<[string, string]>([
    "",
    "",
  ]);
  const [altTeacherIndexes, setAltTeacherIndexes] = useState<
    [number | null, number | null]
  >([null, null]);

  const handleAddLesson = () => {
    if (selectedClassIndex === null || periodsPerWeek <= 0) return;
    let newLesson: Lesson;
    if (lessonType === "normal") {
      if (!newLessonName.trim() || selectedTeacherIndex === null) return;
      newLesson = {
        name: newLessonName.trim(),
        teacher: teachers[selectedTeacherIndex],
        periodsPerWeek,
        type: "normal",
      };
    } else {
      if (
        !altLessonNames[0].trim() ||
        !altLessonNames[1].trim() ||
        altTeacherIndexes[0] === null ||
        altTeacherIndexes[1] === null
      )
        return;
      newLesson = {
        names: [altLessonNames[0].trim(), altLessonNames[1].trim()],
        teachers: [
          teachers[altTeacherIndexes[0]],
          teachers[altTeacherIndexes[1]],
        ],
        periodsPerWeek,
        type: "alternating",
      };
    }
    const updatedClasses = [...classes];
    const currentClass = updatedClasses[selectedClassIndex];
    updatedClasses[selectedClassIndex] = new Class(currentClass.name, [
      ...currentClass.lessons,
      newLesson,
    ]);
    onClassesChange(updatedClasses);
    setNewLessonName("");
    setPeriodsPerWeek(1);
    setAltLessonNames(["", ""]);
    setAltTeacherIndexes([null, null]);
  };

  const isDisabledButton = useMemo(() => {
    if (lessonType === "normal") {
      return newLessonName.trim().length === 0 || selectedTeacherIndex === null;
    } else {
      return (
        altLessonNames[0].trim().length === 0 ||
        altLessonNames[1].trim().length === 0 ||
        altTeacherIndexes[0] === null ||
        altTeacherIndexes[1] === null ||
        altLessonNames[0] === altLessonNames[1] ||
        altTeacherIndexes[0] === altTeacherIndexes[1]
      );
    }
  }, [
    lessonType,
    newLessonName,
    selectedTeacherIndex,
    altLessonNames,
    altTeacherIndexes,
  ]);

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
      t => t.name === getLessonTeacher(lesson).name,
    );

    if (teacherIndex !== -1) {
      setEditingLesson({
        classIndex,
        lessonIndex,
        name: getLessonName(lesson),
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
      // Only allow editing normal lessons for now
      updatedLessons[editingLesson.lessonIndex] = {
        name: editingLesson.name.trim(),
        teacher: teachers[editingLesson.teacherIndex],
        periodsPerWeek: editingLesson.periodsPerWeek,
        type: "normal" as const,
      };
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
    // Only allow quick edit for normal lessons
    if (lesson.type === "normal") {
      const updatedLesson = {
        name: getLessonName(lesson),
        teacher: getLessonTeacher(lesson),
        periodsPerWeek: Math.max(1, newValue),
        type: "normal" as const,
      };
      const updatedLessons = [...currentClass.lessons];
      updatedLessons[lessonIndex] = updatedLesson;
      updatedClasses[classIndex] = new Class(currentClass.name, updatedLessons);
      onClassesChange(updatedClasses);
    }
  };

  // Update the export all lessons handler
  const handleExportAllLessonsToCSV = () => {
    if (classes.length === 0) return;
    exportAllLessonsToCSV(classes);
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
        <h4 className="mb-4 flex items-center text-lg font-semibold text-blue-500">
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
                  ore
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
                        {isAlternatingLesson(lesson) ? (
                          <div>
                            <span className="font-medium text-slate-700 dark:text-slate-100">
                              {lesson.names[0]} / {lesson.names[1]}
                            </span>
                          </div>
                        ) : (
                          <span className="font-medium text-slate-700 dark:text-slate-100">
                            {getLessonName(lesson)}
                          </span>
                        )}
                        <div className="mt-1 md:hidden">
                          <div className="mt-2 flex gap-2">
                            <ColorButton
                              onClick={() =>
                                handleStartEditLesson(classIndex, lessonIndex)
                              }
                              className="px-2 py-1"
                            >
                              Editează
                            </ColorButton>
                            <ColorButton
                              onClick={() =>
                                handleRemoveLesson(classIndex, lessonIndex)
                              }
                              className="px-3 py-1.5"
                            >
                              Șterge
                            </ColorButton>
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
                        {isAlternatingLesson(lesson) ? (
                          <div className="flex flex-col">
                            <span className="text-bold text-gray-700">
                              {lesson.teachers[0].name} /{" "}
                              {lesson.teachers[1].name}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-bold text-gray-700">
                              {getLessonTeacher(lesson).name}
                            </span>
                          </div>
                        )}
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
                        <span className="text-bold text-gray-700">
                          {lesson.periodsPerWeek}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="hidden p-3 text-center md:table-cell">
                    {editingLesson &&
                    editingLesson.classIndex === classIndex &&
                    editingLesson.lessonIndex === lessonIndex ? (
                      <div className="flex justify-center gap-2">
                        <GradientButton
                          variant="blue"
                          onClick={handleSaveEditLesson}
                          className="rounded-lg bg-red-500 px-3 py-1 text-xs text-white transition-all duration-300 hover:bg-emerald-700"
                        >
                          Salvează
                        </GradientButton>
                        <button
                          onClick={handleCancelEditLesson}
                          className="rounded-lg bg-slate-600 px-3 py-1 text-xs text-white transition-all duration-300 hover:bg-slate-700"
                        >
                          Anulează
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-2">
                        <ColorButton
                          onClick={() =>
                            handleStartEditLesson(classIndex, lessonIndex)
                          }
                          variant="blue"
                          className="px-3 py-1 text-xs"
                        >
                          Editează
                        </ColorButton>
                        <ColorButton
                          variant="red"
                          onClick={() =>
                            handleRemoveLesson(classIndex, lessonIndex)
                          }
                          className="px-3 py-1.5 text-xs"
                        >
                          Șterge
                        </ColorButton>
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 p-8">
      <div className="mb-4 flex items-center gap-2 px-4">
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
            stroke="black"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="m17 21-5-4-5 4V3.889a.92.92 0 0 1 .244-.629.808.808 0 0 1 .59-.26h8.333a.81.81 0 0 1 .589.26.92.92 0 0 1 .244.63V21Z"
          />
        </svg>

        <span className="text-lg font-semibold">Gestionare Profesori</span>
        <ThemeButton />
      </div>

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
            <h3 className="mb-6 flex items-center text-lg text-xl font-semibold">
              <span className="mr-3 text-2xl">
                <SiGoogleclassroom strokeWidth={0.1} />
              </span>{" "}
              Selectați Clasa
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
                  <div className="font-medium text-gray-700">{cls.name}</div>
                  <div className="mt-1 text-sm">
                    {cls.lessons.length} lecții, {cls.getTotalPeriodsPerWeek()}{" "}
                    ore
                  </div>
                </button>
              ))}
            </div>

            {/* Export/Import buttons for all classes */}
            <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-end">
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
                className="flex items-center justify-center rounded-md border border-black px-4 py-2 hover:bg-black hover:text-white"
              >
                <span className="mr-2">
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="black"
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
                <span className="font-medium">Importă CSV</span>
              </label>

              <button
                onClick={handleExportAllLessonsToCSV}
                className="flex items-center justify-center rounded-md border border-black px-4 py-2 hover:bg-black hover:text-white"
              >
                <span className="mr-2">
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="black"
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
                <span className="font-medium">Exportă CSV</span>
              </button>
            </div>
          </GradientContainer>

          {selectedClassIndex !== null && (
            <GradientContainer className="mb-8 p-8">
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h3 className="flex items-center text-xl font-semibold">
                  <span className="mr-3 text-2xl">
                    <MdOutlineLibraryBooks color="black" />
                  </span>{" "}
                  Adaugă Lecție la {classes[selectedClassIndex].name}
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
                        )
                          .then(() => (e.target.value = ""))
                          .catch(() => (e.target.value = ""));
                      }
                    }}
                    className="hidden"
                    id={`import-class-${selectedClassIndex}`}
                  />
                  <label
                    htmlFor={`import-class-${selectedClassIndex}`}
                    className="flex cursor-pointer items-center rounded-lg bg-indigo-500/20 px-3 py-1.5 text-indigo-500 transition-all duration-300 hover:bg-indigo-500/30 hover:text-indigo-200"
                  >
                    <span className="mr-2">📤</span>
                    <span>Importă</span>
                  </label>

                  <ColorButton
                    onClick={() =>
                      handleExportClassLessonsToCSV(classes[selectedClassIndex])
                    }
                    className="flex items-center px-3 py-1.5"
                  >
                    <span className="mr-2">📥</span>
                    <span>Exportă</span>
                  </ColorButton>
                </div>
              </div>

              {/* Add Teacher Periods Summary Section */}
              <GradientContainer variant="light" className="mb-6 p-4">
                <h4 className="text-md mb-3 flex items-center font-semibold text-blue-500">
                  <span className="mr-2">
                    <MdOutlineSummarize />
                  </span>{" "}
                  Rezumat Profesori
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {teachers.map(teacher => {
                    // Calculate total periods this teacher has with this class
                    const teacherPeriods = classes[selectedClassIndex].lessons
                      .filter(lesson => {
                        for (const l of getAllTeachers(lesson)) {
                          if (l.name === teacher.name) {
                            return true;
                          }
                        }
                        return false;
                      })
                      .reduce(
                        (total, lesson) => total + lesson.periodsPerWeek,
                        0,
                      );

                    return (
                      <div
                        key={teacher.name}
                        className={`rounded-lg p-3 ${
                          teacherPeriods > 0
                            ? "border border-blue-500/30 bg-blue-600/25 dark:bg-blue-900/20"
                            : "border border-slate-600/30 bg-slate-300/25 dark:bg-slate-800/30"
                        } transition-all duration-300`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{teacher.name}</span>
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              teacherPeriods > 0
                                ? "bg-blue-500/80 text-gray-50 dark:text-blue-200"
                                : "bg-slate-700/20 dark:text-slate-400"
                            }`}
                          >
                            {teacherPeriods} ore
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GradientContainer>

              <div className="mb- 6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="col-span-full">
                  <label className="text-bold mb-2 block text-blue-500">
                    Tip Lecție
                  </label>
                  <select
                    value={lessonType}
                    onChange={e =>
                      setLessonType(e.target.value as "normal" | "alternating")
                    }
                    className="w-full rounded-lg border border-slate-600/50 bg-slate-100 p-3"
                  >
                    <option value="normal">Normală</option>
                    <option value="alternating">Alternantă</option>
                  </select>
                </div>
                {lessonType === "normal" ? (
                  <>
                    <div>
                      <label className="text-bold mb-2 block text-blue-500">
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
                      <label className="text-bold mb-2 block text-blue-500">
                        Profesor
                      </label>
                      <select
                        value={
                          selectedTeacherIndex !== null
                            ? selectedTeacherIndex
                            : ""
                        }
                        onChange={e =>
                          setSelectedTeacherIndex(
                            e.target.value
                              ? parseInt(e.target.value, 10)
                              : null,
                          )
                        }
                        className="w-full rounded-lg border border-slate-600/50 bg-slate-100 p-3"
                      >
                        <option value="">Selectează Profesor</option>
                        {teachers.map((teacher, index) => (
                          <option key={index} value={index}>
                            {teacher.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-bold mb-2 block text-blue-500">
                        Nume Materie (Săptămâna 1)
                      </label>
                      <TextInput
                        value={altLessonNames[0]}
                        onChange={e =>
                          setAltLessonNames([e.target.value, altLessonNames[1]])
                        }
                        placeholder="ex. 'Arte'"
                        className="w-full p-3"
                      />
                    </div>
                    <div>
                      <label className="text-bold mb-2 block text-blue-500">
                        Profesor (Săptămâna 1)
                      </label>
                      <select
                        value={
                          altTeacherIndexes[0] !== null
                            ? altTeacherIndexes[0]
                            : ""
                        }
                        onChange={e =>
                          setAltTeacherIndexes([
                            e.target.value
                              ? parseInt(e.target.value, 10)
                              : null,
                            altTeacherIndexes[1],
                          ])
                        }
                        className="w-full rounded-lg border border-slate-600/50 bg-slate-100 p-3"
                      >
                        <option value="">Selectează Profesor</option>
                        {teachers.map((teacher, index) => (
                          <option key={index} value={index}>
                            {teacher.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-bold mb-2 block text-blue-500">
                        Nume Materie (Săptămâna 2)
                      </label>
                      <TextInput
                        value={altLessonNames[1]}
                        onChange={e =>
                          setAltLessonNames([altLessonNames[0], e.target.value])
                        }
                        placeholder="ex. 'Teorie Muzicală'"
                        className="w-full p-3"
                      />
                    </div>
                    <div>
                      <label className="text-bold mb-2 block text-blue-500">
                        Profesor (Săptămâna 2)
                      </label>
                      <select
                        value={
                          altTeacherIndexes[1] !== null
                            ? altTeacherIndexes[1]
                            : ""
                        }
                        onChange={e =>
                          setAltTeacherIndexes([
                            altTeacherIndexes[0],
                            e.target.value
                              ? parseInt(e.target.value, 10)
                              : null,
                          ])
                        }
                        className="w-full rounded-lg border border-slate-600/50 bg-slate-100 p-3"
                      >
                        <option value="">Selectează Profesor</option>
                        {teachers.map((teacher, index) => (
                          <option key={index} value={index}>
                            {teacher.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="mb-6">
                <label className="text-bold mb-2 block text-blue-500">
                  Ore pe Săptămână
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
                  <div className="flex h-10 w-12 items-center justify-center rounded-lg border border-blue-500/30 bg-slate-200 dark:bg-blue-900/20 dark:text-blue-500">
                    {periodsPerWeek}
                  </div>

                  <div className="inline-flex items-center"></div>
                </div>

                <label className="group relative flex cursor-pointer items-center">
                  <input className="peer sr-only" type="checkbox" />
                  <div className="h-8 w-8 rounded-lg border-2 border-blue-500 bg-white from-blue-500 to-blue-900 transition-all duration-300 ease-in-out peer-checked:rotate-12 peer-checked:border-0 peer-checked:bg-gradient-to-br after:absolute after:top-1/2 after:left-1/2 after:h-5 after:w-5 after:-translate-x-1/2 after:-translate-y-1/2 after:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWxpbmUgcG9pbnRzPSIyMCA2IDkgMTcgNCAxMiI+PC9wb2x5bGluZT48L3N2Zz4=')] after:bg-contain after:bg-no-repeat after:opacity-0 after:transition-opacity after:duration-300 after:content-[''] peer-checked:after:opacity-100 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
                  <span className="text-medium ml-3 font-medium text-gray-900">
                    Împare clasa in 2 grupe - Bilingv si Intensiv
                  </span>
                </label>
              </div>

              <div className="text-center">
                <button
                  onClick={handleAddLesson}
                  disabled={isDisabledButton}
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
