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
import { LuBookMarked } from "react-icons/lu";
import { TfiExport, TfiImport } from "react-icons/tfi";

interface LessonsTabProps {
  classes: Class[];
  teachers: Teacher[];
  onClassesChange: (classes: Class[]) => void;
}

type EditingLesson =
  | {
      type: "normal";
      classIndex: number;
      lessonIndex: number;
      name: string;
      teacherIndex: number;
      periodsPerWeek: number;
    }
  | {
      type: "alternating";
      classIndex: number;
      lessonIndex: number;
      names: [string, string];
      teacherIndexes: [number, number];
      periodsPerWeek: number;
    }
  | {
      type: "group";
      classIndex: number;
      lessonIndex: number;
      name: string;
      teacherIndexes: [number, number];
      periodsPerWeek: number;
    };

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
  const [lessonType, setLessonType] = useState<
    "normal" | "alternating" | "group"
  >("normal");
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
      if (newLessonName.includes("/")) {
        alert("Numele lecție nu poate să conțină /");
        return;
      }
      newLesson = {
        name: newLessonName.trim(),
        teacher: teachers[selectedTeacherIndex],
        periodsPerWeek,
        type: "normal",
      };
    } else if (lessonType === "group") {
      if (!newLessonName.trim()) return;
      if (newLessonName.includes("/")) {
        alert("Numele lecție nu poate să conțină /");
        return;
      }
      if (altTeacherIndexes[0] === null || altTeacherIndexes[1] === null)
        return;
      newLesson = {
        name: newLessonName.trim(),
        teachers: [
          teachers[altTeacherIndexes[0]],
          teachers[altTeacherIndexes[1]],
        ],
        periodsPerWeek,
        type: "group",
      };
    } else {
      if (
        !altLessonNames[0].trim() ||
        !altLessonNames[1].trim() ||
        altTeacherIndexes[0] === null ||
        altTeacherIndexes[1] === null
      )
        return;
      if (altLessonNames[0].includes("/") || altLessonNames[1].includes("/")) {
        alert("Numele lecție nu poate să conțină /");
        return;
      }
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

  const errorMsg = useMemo(() => {
    if (
      (newLessonName.includes("/") &&
        (lessonType === "group" || lessonType === "normal")) ||
      (altLessonNames.some(name => name.includes("/")) &&
        lessonType === "alternating")
    ) {
      return "Nu puteți folosti '/' în nume";
    }
    return null;
  }, [newLessonName, altLessonNames, lessonType]);

  const isDisabledButton = useMemo(() => {
    if (lessonType === "normal") {
      return (
        newLessonName.trim().length === 0 ||
        selectedTeacherIndex === null ||
        newLessonName.includes("/")
      );
    } else if (lessonType === "group") {
      return (
        newLessonName.trim().length === 0 ||
        newLessonName.includes("/") ||
        altTeacherIndexes[0] === null ||
        altTeacherIndexes[1] === null ||
        altTeacherIndexes[0] === altTeacherIndexes[1]
      );
    } else {
      return (
        altLessonNames[0].trim().length === 0 ||
        altLessonNames[1].trim().length === 0 ||
        altLessonNames[0].includes("/") ||
        altLessonNames[1].includes("/") ||
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
    if (lesson.type === "normal") {
      const teacherIndex = teachers.findIndex(
        t => t.name === lesson.teacher.name,
      );
      setEditingLesson({
        type: "normal",
        classIndex,
        lessonIndex,
        name: lesson.name,
        teacherIndex,
        periodsPerWeek: lesson.periodsPerWeek,
      });
    } else if (lesson.type === "alternating") {
      const teacherIndexes: [number, number] = [
        teachers.findIndex(t => t.name === lesson.teachers[0].name),
        teachers.findIndex(t => t.name === lesson.teachers[1].name),
      ];
      setEditingLesson({
        type: "alternating",
        classIndex,
        lessonIndex,
        names: [lesson.names[0], lesson.names[1]],
        teacherIndexes,
        periodsPerWeek: lesson.periodsPerWeek,
      });
    } else if (lesson.type === "group") {
      const teacherIndexes: [number, number] = [
        teachers.findIndex(t => t.name === lesson.teachers[0].name),
        teachers.findIndex(t => t.name === lesson.teachers[1].name),
      ];
      setEditingLesson({
        type: "group",
        classIndex,
        lessonIndex,
        name: lesson.name,
        teacherIndexes,
        periodsPerWeek: lesson.periodsPerWeek,
      });
    }
  };

  const handleSaveEditLesson = () => {
    if (!editingLesson) return;
    const updatedClasses = [...classes];
    const currentClass = updatedClasses[editingLesson.classIndex];
    const updatedLessons = [...currentClass.lessons];

    if (editingLesson.type === "normal") {
      updatedLessons[editingLesson.lessonIndex] = {
        name: editingLesson.name.trim(),
        teacher: teachers[editingLesson.teacherIndex],
        periodsPerWeek: editingLesson.periodsPerWeek,
        type: "normal",
      };
    } else if (editingLesson.type === "alternating") {
      updatedLessons[editingLesson.lessonIndex] = {
        names: [editingLesson.names[0].trim(), editingLesson.names[1].trim()],
        teachers: [
          teachers[editingLesson.teacherIndexes[0]],
          teachers[editingLesson.teacherIndexes[1]],
        ],
        periodsPerWeek: editingLesson.periodsPerWeek,
        type: "alternating",
      };
    } else if (editingLesson.type === "group") {
      updatedLessons[editingLesson.lessonIndex] = {
        name: editingLesson.name.trim(),
        teachers: [
          teachers[editingLesson.teacherIndexes[0]],
          teachers[editingLesson.teacherIndexes[1]],
        ],
        periodsPerWeek: editingLesson.periodsPerWeek,
        type: "group",
      };
    }

    updatedClasses[editingLesson.classIndex] = new Class(
      currentClass.name,
      updatedLessons,
    );
    onClassesChange(updatedClasses);
    setEditingLesson(null);
  };

  const handleCancelEditLesson = () => {
    setEditingLesson(null);
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
        <h4 className="mb-4 flex items-center text-lg font-bold text-blue-500">
          <span className="mr-2"></span> Lecții pentru {currentClass.name}
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
                  Tip
                </th>
                <th className="border-b border-slate-600/50 p-3 text-center font-medium tracking-wide">
                  Ore
                </th>
                <th className="hidden w-32 border-b border-slate-600/50 p-3 text-center font-medium tracking-wide md:table-cell">
                  Acțiuni
                </th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson, lessonIndex) => {
                const isEditing =
                  editingLesson &&
                  editingLesson.classIndex === classIndex &&
                  editingLesson.lessonIndex === lessonIndex;
                return (
                  <tr
                    key={lessonIndex}
                    className="border-b border-slate-700/50 transition-all duration-300 hover:bg-slate-400/10 dark:hover:bg-slate-700/20"
                  >
                    {/* Materie cell */}
                    <td className="p-3">
                      {isEditing ? (
                        editingLesson.type === "normal" ||
                        editingLesson.type === "group" ? (
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
                        ) : editingLesson.type === "alternating" ? (
                          <div className="flex flex-col gap-1">
                            <input
                              type="text"
                              value={editingLesson.names[0]}
                              onChange={e =>
                                setEditingLesson({
                                  ...editingLesson,
                                  names: [
                                    e.target.value,
                                    editingLesson.names[1],
                                  ],
                                })
                              }
                              className="w-full rounded-lg border border-slate-600/50 bg-slate-100 p-2 focus:ring-2 focus:ring-blue-500/50 dark:bg-slate-700/30 dark:text-white"
                              placeholder="Nume săpt. 1"
                            />
                            <input
                              type="text"
                              value={editingLesson.names[1]}
                              onChange={e =>
                                setEditingLesson({
                                  ...editingLesson,
                                  names: [
                                    editingLesson.names[0],
                                    e.target.value,
                                  ],
                                })
                              }
                              className="w-full rounded-lg border border-slate-600/50 bg-slate-100 p-2 focus:ring-2 focus:ring-blue-500/50 dark:bg-slate-700/30 dark:text-white"
                              placeholder="Nume săpt. 2"
                            />
                          </div>
                        ) : null
                      ) : isAlternatingLesson(lesson) ? (
                        <span className="font-medium text-slate-700 dark:text-slate-100">
                          {lesson.names[0]} / {lesson.names[1]}
                        </span>
                      ) : (
                        <span className="font-medium text-slate-700 dark:text-slate-100">
                          {getLessonName(lesson)}
                        </span>
                      )}
                    </td>
                    {/* Profesor cell */}
                    <td className="p-3">
                      {isEditing ? (
                        editingLesson.type === "normal" ? (
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
                        ) : editingLesson.type === "alternating" ||
                          editingLesson.type === "group" ? (
                          <div className="flex flex-col gap-1">
                            <select
                              value={editingLesson.teacherIndexes[0]}
                              onChange={e =>
                                setEditingLesson({
                                  ...editingLesson,
                                  teacherIndexes: [
                                    parseInt(e.target.value, 10),
                                    editingLesson.teacherIndexes[1],
                                  ],
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
                            <select
                              value={editingLesson.teacherIndexes[1]}
                              onChange={e =>
                                setEditingLesson({
                                  ...editingLesson,
                                  teacherIndexes: [
                                    editingLesson.teacherIndexes[0],
                                    parseInt(e.target.value, 10),
                                  ],
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
                          </div>
                        ) : null
                      ) : isAlternatingLesson(lesson) ||
                        lesson.type === "group" ? (
                        <span className="text-bold text-gray-700">
                          {lesson.teachers[0].name} / {lesson.teachers[1].name}
                        </span>
                      ) : (
                        <span className="text-bold text-gray-700">
                          {getLessonTeacher(lesson).name}
                        </span>
                      )}
                    </td>
                    {/* Tip cell */}
                    <td className="p-3 text-center">
                      {lesson.type === "normal"
                        ? "Normală"
                        : lesson.type === "alternating"
                          ? "Alternantă"
                          : "Grupă"}
                    </td>
                    {/* Ore cell */}
                    <td className="p-3 text-center">
                      {isEditing ? (
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
                        <span className="text-bold text-gray-700">
                          {lesson.periodsPerWeek}
                        </span>
                      )}
                    </td>
                    {/* Actions cell */}
                    <td className="hidden p-3 text-center md:table-cell">
                      {isEditing ? (
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
                );
              })}
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
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m17 21-5-4-5 4V3.889a.92.92 0 0 1 .244-.629.808.808 0 0 1 .59-.26h8.333a.81.81 0 0 1 .589.26.92.92 0 0 1 .244.63V21Z"
          />
        </svg>

        <span className="text-lg font-semibold">Gestionare Profesori</span>
        <ThemeButton />
      </div>

      {classes.length === 0 ? (
        <GradientContainer className="p-8">
          <div className="flex flex-col items-center justify-center py-8">
            <LuBookMarked className="mb-4 text-4xl" />
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
                    className="flex cursor-pointer items-center rounded-lg bg-indigo-500/20 px-3 py-1.5 text-indigo-500 transition-all duration-300 hover:bg-indigo-500/30 hover:text-indigo-400"
                  >
                    <TfiImport className="mr-2" />
                    <span>Importă</span>
                  </label>

                  <ColorButton
                    onClick={() =>
                      handleExportClassLessonsToCSV(classes[selectedClassIndex])
                    }
                    className="flex items-center px-3 py-1.5"
                  >
                    <TfiExport className="mr-2" />
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
                      setLessonType(
                        e.target.value as "normal" | "alternating" | "group",
                      )
                    }
                    className="w-full rounded-lg border border-slate-600/50 bg-slate-100 p-3"
                  >
                    <option value="normal">Normală</option>
                    <option value="alternating">
                      Alternantă (ex. Desen / Muzică)
                    </option>
                    <option value="group">împărțită pe grupe</option>
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
                ) : lessonType === "alternating" ? (
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
                ) : (
                  <>
                    <div className="md:row-span-2 md:my-auto">
                      <label className="text-bold mb-2 block text-blue-500">
                        Nume Materie
                      </label>
                      <TextInput
                        value={newLessonName}
                        onChange={e => setNewLessonName(e.target.value)}
                        placeholder="Numele materiei (ex. 'Matematică', 'Fizică')"
                        className="w-full p-3"
                      />
                    </div>
                    <div className="flex w-full flex-col">
                      <div>
                        <label className="text-bold mb-2 block text-blue-500">
                          Profesor (Grupa 1)
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
                          Profesor (Groupa 2)
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
              </div>

              <div className="text-center">
                <button
                  onClick={handleAddLesson}
                  disabled={isDisabledButton}
                  className={`relative transform rounded-xl px-6 py-2 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 md:px-8 md:py-3 ${
                    isDisabledButton
                      ? "cursor-not-allowed bg-gray-600"
                      : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 hover:shadow-blue-500/30"
                  }`}
                >
                  Adaugă Lecție
                </button>
                {errorMsg && (
                  <p className="mt-2 font-bold text-red-600">{errorMsg}</p>
                )}
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
