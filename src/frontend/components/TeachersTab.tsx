import { useState, useRef } from "react";
import {
  Teacher,
  Availability,
  DAYS,
  PERIODS_PER_DAY,
  Class,
  exportTeachersToCSV,
  importTeachersFromCSV,
  getLessonTeacher,
  getLessonName,
  getAllTeachers,
} from "../../util/timetable";
import TeacherAvailabilityModal from "./TeacherAvailabilityModal";
import GradientContainer from "./common/GradientContainer";
import TextInput from "./common/TextInput";
import Note from "./common/Note";
import ColorButton from "./common/ColorButton";
import ThemeButton from "./common/ThemeButton";
import { PiChalkboardTeacher } from "react-icons/pi";

import { PiClipboardText } from "react-icons/pi";



interface TeachersTabProps {
  teachers: Teacher[];
  classes: Class[];
  onTeachersChange: (teachers: Teacher[]) => void;
  onClassesChange: (classes: Class[]) => void;
}

/**
 * Custom hook for teacher management logic
 */
const useTeacherManagement = (
  teachers: Teacher[],
  classes: Class[],
  onTeachersChange: (teachers: Teacher[]) => void,
  onClassesChange: (classes: Class[]) => void,
) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTeacherIndex, setModalTeacherIndex] = useState<number | null>(
    null,
  );

  const addTeacher = (name: string) => {
    if (name.includes("/")) {
      alert("Numele profesorului nu poată să conțină /");
      return false;
    }

    if (name.trim()) {
      const availability = new Availability(DAYS, PERIODS_PER_DAY);
      // By default, make all slots available
      for (let day = 0; day < DAYS; day++) {
        availability.setDay(day, true);
      }
      
      // Check if teacher email exists in localStorage
      const savedEmail = localStorage.getItem(`teacher_email_${name.trim()}`);
      const newTeacher = new Teacher(name.trim(), availability, savedEmail || undefined);
      
      // Save email to localStorage if it exists
      if (savedEmail) {
        localStorage.setItem(`teacher_email_${name.trim()}`, savedEmail);
      }
      
      onTeachersChange([...teachers, newTeacher]);
      return true;
    }
    return false;
  };

  const removeTeacher = (index: number) => {
    if (index < 0 || index >= teachers.length) {
      return;
    }

    const updatedClasses = [...classes];
    const updatedTeachers = [...teachers];

    const removedTeacher = updatedTeachers[index];
    // Remove every lesson of the teacher
    for (let classIdx = 0; classIdx < updatedClasses.length; classIdx++) {
      const cls = updatedClasses[classIdx];
      for (let lessonIdx = 0; lessonIdx < cls.lessons.length; lessonIdx++) {
        const lesson = cls.lessons[lessonIdx];
        for (const teacher of getAllTeachers(lesson)) {
          if (teacher.name === removedTeacher.name) {
            cls.lessons.splice(lessonIdx, 1);
          }
        }
      }
    }
    updatedTeachers.splice(index, 1); // remove from teachers array

    onClassesChange(updatedClasses);
    onTeachersChange(updatedTeachers);
  };

  const editAvailability = (index: number) => {
    setModalTeacherIndex(index);
    setModalOpen(true);
  };

  const saveAvailability = (newAvailability: Availability) => {
    if (modalTeacherIndex !== null) {
      const updatedTeachers = [...teachers];
      const updatedClasses = [...classes];
      const originalTeacher = updatedTeachers[modalTeacherIndex];

      // Create new teacher with the same ID but updated availability
      const newTeacher = new Teacher(originalTeacher.name, newAvailability);
      newTeacher.id = originalTeacher.id; // Preserve the original ID

      updatedTeachers[modalTeacherIndex] = newTeacher;
      for (const cls of updatedClasses) {
        for (const lesson of cls.lessons) {
          if (lesson.type === "normal") {
            if (lesson.teacher.name === originalTeacher.name) {
              lesson.teacher = newTeacher;
            }
          } else {
            for (let i = 0; i < lesson.teachers.length; i++) {
              if (lesson.teachers[i].name === originalTeacher.name) {
                lesson.teachers[i] = newTeacher;
              }
            }
          }
        }
      }

      onTeachersChange(updatedTeachers);
      onClassesChange(updatedClasses);
    }
  };

  const updateTeacherName = (index: number, newName: string) => {
    if (newName.trim()) {
      const oldTeacherName = teachers[index].name;
      const newTeacherName = newName.trim();

      // If name hasn't changed, no need to propagate updates
      if (oldTeacherName === newTeacherName) {
        return false;
      }

      // First update the teacher's name
      const updatedTeachers = [...teachers];
      const originalTeacher = updatedTeachers[index];
      const newTeacher = new Teacher(
        newTeacherName,
        originalTeacher.availability,
      );
      newTeacher.id = originalTeacher.id; // Preserve the original ID
      updatedTeachers[index] = newTeacher;

      // Now we need to update all classes that use this teacher
      const updatedClasses = classes.map(cls => {
        // Check if any lessons in this class use the teacher
        const hasTeacher = cls.lessons.some(
          lesson => getLessonTeacher(lesson).name === oldTeacherName,
        );

        if (!hasTeacher) return cls; // No changes needed

        // Update lessons that use this teacher
        const updatedLessons = cls.lessons.map(lesson => {
          if (getLessonTeacher(lesson).name === oldTeacherName) {
            return {
              name: getLessonName(lesson),
              teacher: newTeacher, // Use the new teacher object with preserved ID
              periodsPerWeek: lesson.periodsPerWeek,
              type: "normal" as const,
            };
          }
          return lesson;
        });

        // Return a new class with the updated lessons
        return new Class(cls.name, updatedLessons);
      });

      // Save all the changes
      onTeachersChange(updatedTeachers);
      onClassesChange(updatedClasses);
      return true;
    }
    return false;
  };

  // Add a function to update lesson periods
  const updateLessonPeriods = (
    teacherName: string,
    className: string,
    subjectName: string,
    newPeriods: number,
  ) => {
    if (newPeriods < 1) return false;

    const updatedClasses = [...classes];
    let changed = false;

    // Find the class and lesson to update
    updatedClasses.forEach((cls, classIndex) => {
      if (cls.name === className) {
        const lessonIndex = cls.lessons.findIndex(
          lesson =>
            getLessonTeacher(lesson).name === teacherName &&
            getLessonName(lesson) === subjectName,
        );

        if (lessonIndex !== -1) {
          const updatedLessons = [...cls.lessons];
          updatedLessons[lessonIndex].periodsPerWeek = newPeriods;
          updatedClasses[classIndex] = new Class(cls.name, updatedLessons);
          changed = true;
        }
      }
    });

    if (changed) {
      onClassesChange(updatedClasses);
      return true;
    }
    return false;
  };

  return {
    modalOpen,
    setModalOpen,
    modalTeacherIndex,
    addTeacher,
    removeTeacher,
    editAvailability,
    saveAvailability,
    updateTeacherName,
    updateLessonPeriods,
  };
};

/**
 * Component for adding new teachers
 */
const TeacherForm: React.FC<{
  onAddTeacher: (name: string) => boolean;
}> = ({ onAddTeacher }) => {
  const [newTeacherName, setNewTeacherName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddTeacher(newTeacherName)) {
      setNewTeacherName("");
    }
  };

  return (
    <GradientContainer className="mb-8 p-8">
      <h3 className="mb-6 flex items-center text-xl font-semibold">
        <span className="mr-3 text-2xl">
          <PiChalkboardTeacher />
        </span>{" "}
        Adaugă Profesor Nou
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
        <TextInput
          value={newTeacherName}
          onChange={e => setNewTeacherName(e.target.value)}
          placeholder="Numele profesorului"
          className="flex-1 p-3"
        />
        <button
          //variant="blue"
          type="submit"
          className="rounded-md bg-black px-6 py-3 font-medium text-white hover:bg-gray-400"
        >
          Adaugă Profesor
        </button>
      </form>
    </GradientContainer>
  );
};

/**
 * Helper function to get all subjects taught by a teacher across classes
 */
const getTeacherSubjects = (teacherName: string, classes: Class[]) => {
  // Map of subject name to array of {className, periodsPerWeek}
  const subjects: {
    [subject: string]: { className: string; periodsPerWeek: number }[];
  } = {};

  classes.forEach(cls => {
    cls.lessons.forEach(lesson => {
      for (const teacher of getAllTeachers(lesson)) {
        if (teacher.name === teacherName) {
          const subj = getLessonName(lesson);
          if (!subjects[subj]) {
            subjects[subj] = [];
          }
          subjects[subj].push({
            className: cls.name,
            periodsPerWeek: lesson.periodsPerWeek,
          });
        }
      }
    });
  });

  return subjects;
};

/**
 * Component for a single teacher list item
 */
const TeacherListItem: React.FC<{
  teacher: Teacher;
  classes: Class[];
  onRemove: () => void;
  onEditAvailability: () => void;
  onUpdateName: (name: string) => boolean;
  onUpdateLessonPeriods: (
    teacherName: string,
    className: string,
    subjectName: string,
    newPeriods: number,
  ) => boolean;
  onUpdateEmail: (email: string) => void;
}> = ({
  teacher,
  classes,
  onRemove,
  onEditAvailability,
  onUpdateName,
  onUpdateLessonPeriods,
  onUpdateEmail,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(teacher.name);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState(teacher.email || "");

  // Get all subjects taught by this teacher
  const subjects = getTeacherSubjects(teacher.name, classes);
  const hasSubjects = Object.keys(subjects).length > 0;

  const handleStartEdit = () => {
    setEditName(teacher.name);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (onUpdateName(editName)) {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handlePeriodChange = (
    className: string,
    subjectName: string,
    newValue: string,
  ) => {
    const periods = parseInt(newValue, 10);
    if (!isNaN(periods) && periods > 0) {
      onUpdateLessonPeriods(teacher.name, className, subjectName, periods);
    }
  };

  return (
    <>
      <tr className="border-b border-slate-700/50 transition-all duration-300 hover:bg-slate-400/10 dark:hover:bg-slate-700/20">
        <td className="p-3">
          {isEditing ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="flex-1 rounded-lg border border-slate-600/50 bg-slate-200 p-2 transition-all focus:ring-2 focus:ring-blue-500/50 dark:bg-slate-700/30 dark:text-white"
                autoFocus
              />
              <div className="mt-2 flex gap-2 sm:mt-0">
                <button
                  onClick={handleSaveEdit}
                  className="rounded-lg bg-emerald-600 px-3 py-1 text-xs text-white transition-all duration-300 hover:bg-emerald-700"
                >
                  Salvează
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="rounded-lg bg-slate-600 px-3 py-1 text-xs text-white transition-all duration-300 hover:bg-slate-700"
                >
                  Anulează
                </button>
              </div>
            </div>
          ) : isEditingEmail ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="Email profesor"
                className="flex-1 rounded-lg border border-slate-600/50 bg-slate-200 p-2 transition-all focus:ring-2 focus:ring-blue-500/50 dark:bg-slate-700/30 dark:text-white"
                autoFocus
              />
              <div className="mt-2 flex gap-2 sm:mt-0">
                <button
                  onClick={() => {
                    onUpdateEmail(emailInput);
                    setIsEditingEmail(false);
                  }}
                  className="rounded-lg bg-emerald-600 px-3 py-1 text-xs text-white transition-all duration-300 hover:bg-emerald-700"
                >
                  Salvează
                </button>
                <button
                  onClick={() => {
                    setEmailInput(teacher.email || "");
                    setIsEditingEmail(false);
                  }}
                  className="rounded-lg bg-slate-600 px-3 py-1 text-xs text-white transition-all duration-300 hover:bg-slate-700"
                >
                  Anulează
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 flex flex-col sm:mb-0">
                <span className="font-medium text-slate-700 dark:text-slate-100">
                  {teacher.name}
                </span>
                {teacher.email && (
                  <span className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    {teacher.email}
                  </span>
                )}
                {hasSubjects && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-s mt-1 flex items-center text-blue-400 hover:text-blue-500"
                  >
                    <span className="mr-1">
                      {isExpanded ? "Ascunde" : "Arată"} clasele la care preda
                    </span>
                    <span>{isExpanded ? "▲" : "▼"}</span>
                  </button>
                )}
              </div>
              <ColorButton
                onClick={() => setIsEditingEmail(true)}
                variant="blue"
                className="px-2 py-2 text-sm"
              >
                {teacher.email ? "Editează Email" : "Adaugă Email"}
              </ColorButton>
            </div>
          )}
        </td>
        <td className="hidden p-3 sm:table-cell">
          <div className="flex flex-col gap-2">
            <ColorButton
              onClick={handleStartEdit}
              variant="gray"
              className="px-3 py-1.5"
            >
              Editează Nume
            </ColorButton>
            <ColorButton
              onClick={onEditAvailability}
              variant="blue"
              className="px-3 py-1.5"
            >
              Setează Disponibilitate
            </ColorButton>
          </div>
        </td>
        <td className="flex flex-col justify-end gap-2 p-3 text-right sm:flex-row sm:justify-center sm:text-center">
          <button
            onClick={onEditAvailability}
            className="bg-indigo-500/ rounded-lg px-3 py-1.5 text-indigo-300 transition-all duration-300 hover:bg-indigo-500/30 hover:text-indigo-200 sm:hidden"
          >
            Disponibilitate
          </button>

          <div className="flex items-center justify-center p-3 text-left">
            <button
              className="group relative flex h-11 w-11 cursor-pointer items-center justify-start overflow-hidden rounded-full bg-red-600 shadow-lg transition-all duration-200 hover:w-25 hover:rounded-lg active:translate-x-1 active:translate-y-1"
              onClick={onRemove}
            >
              <div className="flex w-full items-center justify-center transition-all duration-300 group-hover:justify-start group-hover:px-3">
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
                    stroke="white"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"
                  />
                </svg>
              </div>
              <div className="absolute right-2 translate-x-full transform text-lg font-semibold text-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                Șterge
              </div>
            </button>
          </div>
        </td>
      </tr>
      {isExpanded &&
        hasSubjects &&
        Object.entries(subjects).map(([subjectName, classDetails]) => (
          <tr
            key={`${teacher.name}-${subjectName}`}
            className="bg-gray-100 dark:bg-slate-800/30"
          >
            <td
              colSpan={3}
              className="border-b border-slate-700/30 py-2 pr-3 pl-8"
            >
              <div className="font-medium text-slate-900 dark:text-slate-300">
                Materie: <span className="text-cyan-300">{subjectName}</span>
              </div>
              <div className="mt-2 space-y-2">
                {classDetails.map(detail => (
                  <div
                    key={`${teacher.name}-${subjectName}-${detail.className}`}
                    className="flex flex-col gap-2 rounded-lg bg-gray-50 p-2 sm:flex-row sm:items-center sm:justify-between dark:bg-slate-700/20"
                  >
                    <span className="text-slate-700 dark:text-slate-400">
                      Clasa: {detail.className}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="dare:text-slate-400 text-sm text-slate-500">
                        Numar de ore
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={detail.periodsPerWeek}
                        onChange={e =>
                          handlePeriodChange(
                            detail.className,
                            subjectName,
                            e.target.value,
                          )
                        }
                        className="w-16 rounded-lg border border-blue-500/30 bg-slate-200 p-1 text-center text-blue-800 focus:ring-2 focus:ring-blue-500/50 dark:bg-slate-800/50 dark:text-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </td>
          </tr>
        ))}
    </>
  );
};

/**
 * Component for displaying the list of teachers
 */
const TeacherList: React.FC<{
  teachers: Teacher[];
  classes: Class[];
  onRemoveTeacher: (index: number) => void;
  onEditAvailability: (index: number) => void;
  onUpdateTeacherName: (index: number, name: string) => boolean;
  onUpdateLessonPeriods: (
    teacherName: string,
    className: string,
    subjectName: string,
    newPeriods: number,
  ) => boolean;
  onImportTeachers: (importedTeachers: Teacher[]) => void;
  onUpdateTeacherEmail: (index: number, email: string) => void;
}> = ({
  teachers,
  classes,
  onRemoveTeacher,
  onEditAvailability,
  onUpdateTeacherName,
  onUpdateLessonPeriods,
  onImportTeachers,
  onUpdateTeacherEmail,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportToCSV = () => {
    exportTeachersToCSV(teachers, "teachers.csv");
  };

  const handleImportFromCSV = async (file: File) => {
    try {
      const importedTeachers = await importTeachersFromCSV(file);
      onImportTeachers(importedTeachers);
    } catch (error) {
      console.error("Error importing teachers:", error);
      if (error instanceof Error) {
        alert(`Eroare la importarea profesorilor: ${error.message}`);
      } else {
        alert("A apărut o eroare necunoscută la importarea profesorilor");
      }
    }
  };

  return (
    <GradientContainer className="p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="flex items-center text-lg text-xl font-semibold">
          <span className="mr-3 text-2xl">
            <PiClipboardText />
          </span>{" "}
          Listă Profesori
        </h3>

        <div className="flex flex-wrap gap-3">
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
            id="import-teachers-file"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
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
          </button>

          <button
            //variant="green"
            onClick={handleExportToCSV}
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
      </div>

      {teachers.length > 0 ? (
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-200 dark:bg-slate-700/50 dark:text-slate-200">
                <th className="border-b border-slate-600/50 p-3 text-left font-medium tracking-wide">
                  Nume
                </th>
                <th className="hidden border-b border-slate-600/50 p-3 text-left font-medium tracking-wide sm:table-cell">
                  Disponibilitate
                </th>
                <th className="w-28 border-b border-slate-600/50 p-3 text-right font-medium tracking-wide sm:text-center">
                  Acțiuni
                </th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher, index) => (
                <TeacherListItem
                  key={teacher.name}
                  teacher={teacher}
                  classes={classes}
                  onRemove={() => onRemoveTeacher(index)}
                  onEditAvailability={() => onEditAvailability(index)}
                  onUpdateName={name => onUpdateTeacherName(index, name)}
                  onUpdateLessonPeriods={onUpdateLessonPeriods}
                  onUpdateEmail={email => onUpdateTeacherEmail(index, email)}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <span className="mb-4 text-4xl">👨‍🏫</span>
          <p className="mb-2 text-center text-slate-300">
            Nu există profesori adăugați încă. Adăugați primul profesor mai sus.
          </p>
          <p className="text-center text-sm text-blue-400/80">
            Profesorii sunt necesari pentru a crea lecții și a genera orare.
          </p>
        </div>
      )}
    </GradientContainer>
  );
};

/**
 * Main component for teacher management
 */
const TeachersTab: React.FC<TeachersTabProps> = ({
  teachers,
  classes,
  onTeachersChange,
  onClassesChange,
}) => {
  const {
    modalOpen,
    setModalOpen,
    modalTeacherIndex,
    addTeacher,
    removeTeacher,
    editAvailability,
    saveAvailability,
    updateTeacherName,
    updateLessonPeriods,
  } = useTeacherManagement(
    teachers,
    classes,
    onTeachersChange,
    onClassesChange,
  );

  const handleImportTeachers = (importedTeachers: Teacher[]) => {
    if (importedTeachers.length > 0) {
      // Save teacher emails to localStorage
      importedTeachers.forEach(teacher => {
        if (teacher.email) {
          localStorage.setItem(`teacher_email_${teacher.name}`, teacher.email);
        }
      });
      
      // Append imported teachers to existing ones
      onTeachersChange([...teachers, ...importedTeachers]);
      alert(
        `Au fost importați cu succes ${importedTeachers.length} profesori.`,
      );
    } else {
      alert("Nu au fost găsiți profesori în fișierul importat.");
    }
  };

  const handleUpdateTeacherEmail = (index: number, email: string) => {
    const updatedTeachers = [...teachers];
    const teacher = updatedTeachers[index];
    // Update the email property directly
    teacher.email = email;
    
    onTeachersChange(updatedTeachers);
    // Save to localStorage
    localStorage.setItem(
      `teacher_email_${teacher.name}`,
      email,
    );
    // Note: Email will be saved to Firestore when user clicks "Salvează Online"
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 p-8">
      <div className="mb-4 flex items-center gap-2 px-4">
        <svg
          width="20"
          height="20"
          fill="none"
          stroke="currentColor  "
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

        <span className="text-lg font-semibold">Gestionare Profesori</span>
        <ThemeButton />
      </div>

      <TeacherForm onAddTeacher={addTeacher} />

      <TeacherList
        teachers={teachers}
        classes={classes}
        onRemoveTeacher={removeTeacher}
        onEditAvailability={editAvailability}
        onUpdateTeacherName={updateTeacherName}
        onUpdateLessonPeriods={updateLessonPeriods}
        onImportTeachers={handleImportTeachers}
        onUpdateTeacherEmail={handleUpdateTeacherEmail}
      />

      <Note className="mt-6 p-4">
        Setați disponibilitatea fiecărui profesor apăsând pe "Setează
        Disponibilitate". Implicit, toate intervalele orare sunt disponibile
      </Note>

      {modalOpen && modalTeacherIndex !== null && (
        <TeacherAvailabilityModal
          teacher={teachers[modalTeacherIndex]}
          onClose={() => setModalOpen(false)}
          onSave={saveAvailability}
        />
      )}
    </div>
  );
};

export default TeachersTab;
