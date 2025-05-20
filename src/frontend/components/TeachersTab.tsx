import { useState, useRef, useEffect } from "react";
import {
  Teacher,
  Availability,
  DAYS,
  PERIODS_PER_DAY,
  Class,
  Lesson,
  exportTeachersToCSV,
  importTeachersFromCSV,
} from "../../util/timetable";
import TeacherAvailabilityModal from "./TeacherAvailabilityModal";
import GradientButton from "./common/GradientButton";
import GradientContainer from "./common/GradientContainer";
import TextInput from "./common/TextInput";
import Note from "./common/Note";
import ColorButton from "./common/ColorButton";

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
    if (name.trim()) {
      const availability = new Availability(DAYS, PERIODS_PER_DAY);
      // By default, make all slots available
      for (let day = 0; day < DAYS; day++) {
        availability.setDay(day, true);
      }
      const newTeacher = new Teacher(name.trim(), availability);
      onTeachersChange([...teachers, newTeacher]);
      return true;
    }
    return false;
  };

  const removeTeacher = (index: number) => {
    const updatedTeachers = [...teachers];
    updatedTeachers.splice(index, 1);
    onTeachersChange(updatedTeachers);
  };

  const editAvailability = (index: number) => {
    setModalTeacherIndex(index);
    setModalOpen(true);
  };

  const saveAvailability = (newAvailability: Availability) => {
    if (modalTeacherIndex !== null) {
      const updatedTeachers = [...teachers];
      updatedTeachers[modalTeacherIndex] = new Teacher(
        updatedTeachers[modalTeacherIndex].name,
        newAvailability,
      );
      onTeachersChange(updatedTeachers);
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
      updatedTeachers[index] = new Teacher(
        newTeacherName,
        updatedTeachers[index].availability,
      );

      // Now we need to update all classes that use this teacher
      const updatedClasses = classes.map(cls => {
        // Check if any lessons in this class use the teacher
        const hasTeacher = cls.lessons.some(
          lesson => lesson.teacher.name === oldTeacherName,
        );

        if (!hasTeacher) return cls; // No changes needed

        // Update lessons that use this teacher
        const updatedLessons = cls.lessons.map(lesson => {
          if (lesson.teacher.name === oldTeacherName) {
            // Create a new lesson with the updated teacher
            return new Lesson(
              lesson.name,
              updatedTeachers[index], // Use the updated teacher
              lesson.periodsPerWeek,
            );
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
            lesson.teacher.name === teacherName && lesson.name === subjectName,
        );

        if (lessonIndex !== -1) {
          // Create a new lesson with updated periods
          const oldLesson = cls.lessons[lessonIndex];
          const newLesson = new Lesson(
            oldLesson.name,
            oldLesson.teacher,
            newPeriods,
          );

          // Update the lesson in the class
          const updatedLessons = [...cls.lessons];
          updatedLessons[lessonIndex] = newLesson;

          // Create a new class with updated lessons
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
      <h3 className="mb-6 flex items-center text-xl font-semibold text-blue-300">
        <span className="mr-3 text-2xl">👨‍🏫</span> Adaugă Profesor Nou
      </h3>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <TextInput
          value={newTeacherName}
          onChange={e => setNewTeacherName(e.target.value)}
          placeholder="Numele profesorului"
          className="flex-1 p-3"
        />
        <button
          type="submit"
          className="transform rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-medium text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/30"
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
      if (lesson.teacher.name === teacherName) {
        if (!subjects[lesson.name]) {
          subjects[lesson.name] = [];
        }
        subjects[lesson.name].push({
          className: cls.name,
          periodsPerWeek: lesson.periodsPerWeek,
        });
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
  index: number;
  onRemove: () => void;
  onEditAvailability: () => void;
  onUpdateName: (name: string) => boolean;
  onUpdateLessonPeriods: (
    teacherName: string,
    className: string,
    subjectName: string,
    newPeriods: number,
  ) => boolean;
}> = ({
  teacher,
  classes,
  index,
  onRemove,
  onEditAvailability,
  onUpdateName,
  onUpdateLessonPeriods,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(teacher.name);
  const [isExpanded, setIsExpanded] = useState(false);

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
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 flex flex-col sm:mb-0">
                <span className="font-medium text-slate-700 dark:text-slate-100">
                  {teacher.name}
                </span>
                {hasSubjects && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-s mt-1 flex items-center text-blue-400 hover:text-blue-300"
                  >
                    <span className="mr-1">
                      {isExpanded ? "Ascunde" : "Arată"} clasele la care preda
                    </span>
                    <span>{isExpanded ? "▲" : "▼"}</span>
                  </button>
                )}
              </div>
              <ColorButton
                onClick={handleStartEdit}
                variant="blue"
                className="px-2 py-1 text-sm"
              >
                Editează
              </ColorButton>
            </div>
          )}
        </td>
        <td className="hidden p-3 sm:table-cell">
          <ColorButton
            onClick={onEditAvailability}
            variant="indigo"
            className="px-3 py-1.5"
          >
            Setează Disponibilitate
          </ColorButton>
        </td>
        <td className="p-3 text-right sm:text-center">
          <div className="flex flex-col justify-end gap-2 sm:flex-row sm:justify-center">
            <button
              onClick={onEditAvailability}
              className="rounded-lg bg-indigo-500/20 px-3 py-1.5 text-indigo-300 transition-all duration-300 hover:bg-indigo-500/30 hover:text-indigo-200 sm:hidden"
            >
              Disponibilitate
            </button>

            <ColorButton
              onClick={onRemove}
              variant="red"
              className="px-3 py-1.5"
            >
              Șterge
            </ColorButton>
          </div>
        </td>
      </tr>
      {isExpanded &&
        hasSubjects &&
        Object.entries(subjects).map(([subjectName, classDetails]) => (
          <tr
            key={`${teacher.name}-${subjectName}`}
            className="bg-slate-800/30"
          >
            <td
              colSpan={3}
              className="border-b border-slate-700/30 py-2 pr-3 pl-8"
            >
              <div className="font-medium text-slate-300">
                Materie: <span className="text-cyan-300">{subjectName}</span>
              </div>
              <div className="mt-2 space-y-2">
                {classDetails.map(detail => (
                  <div
                    key={`${teacher.name}-${subjectName}-${detail.className}`}
                    className="flex flex-col gap-2 rounded-lg bg-slate-700/20 p-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-slate-400">
                      Clasa: {detail.className}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">
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
                        className="w-16 rounded-lg border border-blue-500/30 bg-slate-800/50 p-1 text-center text-blue-300 focus:ring-2 focus:ring-blue-500/50"
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
}> = ({
  teachers,
  classes,
  onRemoveTeacher,
  onEditAvailability,
  onUpdateTeacherName,
  onUpdateLessonPeriods,
  onImportTeachers,
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
        <h3 className="flex items-center text-xl font-semibold text-blue-300">
          <span className="mr-3 text-2xl">👩‍🏫</span> Listă Profesori
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
          <label
            htmlFor="import-teachers-file"
            className="flex transform cursor-pointer items-center rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/20"
          >
            <span className="mr-2">📤</span>
            <span className="font-medium">Importă CSV</span>
          </label>

          <GradientButton
            variant="green"
            onClick={handleExportToCSV}
            className="flex items-center justify-center px-4 py-2"
          >
            <span className="mr-2">📥</span>
            <span className="font-medium">Exportă CSV</span>
          </GradientButton>
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
                  key={index}
                  teacher={teacher}
                  classes={classes}
                  index={index}
                  onRemove={() => onRemoveTeacher(index)}
                  onEditAvailability={() => onEditAvailability(index)}
                  onUpdateName={name => onUpdateTeacherName(index, name)}
                  onUpdateLessonPeriods={onUpdateLessonPeriods}
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
      // Append imported teachers to existing ones
      onTeachersChange([...teachers, ...importedTeachers]);
      alert(
        `Au fost importați cu succes ${importedTeachers.length} profesori.`,
      );
    } else {
      alert("Nu au fost găsiți profesori în fișierul importat.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl p-8">
      <h2 className="text-gradient-blue mb-4 text-2xl font-bold md:mb-8 md:text-3xl">
        Gestionare Profesori
      </h2>

      <TeacherForm onAddTeacher={addTeacher} />

      <TeacherList
        teachers={teachers}
        classes={classes}
        onRemoveTeacher={removeTeacher}
        onEditAvailability={editAvailability}
        onUpdateTeacherName={updateTeacherName}
        onUpdateLessonPeriods={updateLessonPeriods}
        onImportTeachers={handleImportTeachers}
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
