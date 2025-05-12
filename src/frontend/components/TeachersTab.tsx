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
  const updateLessonPeriods = (teacherName: string, className: string, subjectName: string, newPeriods: number) => {
    if (newPeriods < 1) return false;
    
    const updatedClasses = [...classes];
    let changed = false;
    
    // Find the class and lesson to update
    updatedClasses.forEach((cls, classIndex) => {
      if (cls.name === className) {
        const lessonIndex = cls.lessons.findIndex(
          lesson => lesson.teacher.name === teacherName && lesson.name === subjectName
        );
        
        if (lessonIndex !== -1) {
          // Create a new lesson with updated periods
          const oldLesson = cls.lessons[lessonIndex];
          const newLesson = new Lesson(
            oldLesson.name,
            oldLesson.teacher,
            newPeriods
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
    <div className="mb-8 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 p-8 shadow-xl border border-blue-500/20 backdrop-blur-sm">
      <h3 className="mb-6 text-xl font-semibold text-blue-300 flex items-center">
        <span className="mr-3 text-2xl">👨‍🏫</span> Adaugă Profesor Nou
      </h3>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={newTeacherName}
          onChange={e => setNewTeacherName(e.target.value)}
          placeholder="Numele profesorului"
          className="flex-1 rounded-lg border border-slate-600/50 bg-slate-700/30 p-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-white font-medium shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all duration-300 hover:from-blue-700 hover:to-indigo-700"
        >
          Adaugă Profesor
        </button>
      </form>
    </div>
  );
};

/**
 * Helper function to get all subjects taught by a teacher across classes
 */
const getTeacherSubjects = (teacherName: string, classes: Class[]) => {
  // Map of subject name to array of {className, periodsPerWeek}
  const subjects: { [subject: string]: { className: string; periodsPerWeek: number }[] } = {};
  
  classes.forEach(cls => {
    cls.lessons.forEach(lesson => {
      if (lesson.teacher.name === teacherName) {
        if (!subjects[lesson.name]) {
          subjects[lesson.name] = [];
        }
        subjects[lesson.name].push({
          className: cls.name,
          periodsPerWeek: lesson.periodsPerWeek
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
  onUpdateLessonPeriods: (teacherName: string, className: string, subjectName: string, newPeriods: number) => boolean;
}> = ({ 
  teacher, 
  classes, 
  index, 
  onRemove, 
  onEditAvailability, 
  onUpdateName,
  onUpdateLessonPeriods 
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

  const handlePeriodChange = (className: string, subjectName: string, newValue: string) => {
    const periods = parseInt(newValue, 10);
    if (!isNaN(periods) && periods > 0) {
      onUpdateLessonPeriods(teacher.name, className, subjectName, periods);
    }
  };

  return (
    <>
      <tr className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-all duration-300">
        <td className="p-3">
          {isEditing ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="flex-1 rounded-lg border border-slate-600/50 bg-slate-700/30 p-2 text-white transition-all focus:ring-2 focus:ring-blue-500/50"
                autoFocus
              />
              <div className="flex gap-2 mt-2 sm:mt-0">
                <button
                  onClick={handleSaveEdit}
                  className="rounded-lg bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-700 transition-all duration-300"
                >
                  Salvează
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="rounded-lg bg-slate-600 px-3 py-1 text-xs text-white hover:bg-slate-700 transition-all duration-300"
                >
                  Anulează
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col mb-2 sm:mb-0">
                <span className="font-medium text-slate-100">{teacher.name}</span>
                {hasSubjects && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-s text-blue-400 hover:text-blue-300 mt-1 flex items-center"
                  >
                    <span className="mr-1">{isExpanded ? "Ascunde" : "Arată"} clasele la care preda</span>
                    <span>{isExpanded ? "▲" : "▼"}</span>
                  </button>
                )}
              </div>
              <button
                onClick={handleStartEdit}
                className="text-sm rounded-lg bg-blue-500/20 px-2 py-1 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 transition-all duration-300"
              >
                Editează
              </button>
            </div>
          )}
        </td>
        <td className="p-3 hidden sm:table-cell">
          <button
            onClick={onEditAvailability}
            className="rounded-lg bg-indigo-500/20 px-3 py-1.5 text-indigo-300 hover:bg-indigo-500/30 hover:text-indigo-200 transition-all duration-300"
          >
            Setează Disponibilitate
          </button>
        </td>
        <td className="p-3 text-right sm:text-center">
          <div className="flex flex-col sm:flex-row gap-2 justify-end sm:justify-center">
            <button
              onClick={onEditAvailability}
              className="rounded-lg bg-indigo-500/20 px-3 py-1.5 text-indigo-300 hover:bg-indigo-500/30 hover:text-indigo-200 transition-all duration-300 sm:hidden"
            >
              Disponibilitate
            </button>
            <button
              onClick={onRemove}
              className="rounded-lg bg-red-500/20 px-3 py-1.5 text-red-300 hover:bg-red-500/30 hover:text-red-200 transition-all duration-300"
            >
              Șterge
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && hasSubjects && Object.entries(subjects).map(([subjectName, classDetails]) => (
        <tr key={`${teacher.name}-${subjectName}`} className="bg-slate-800/30">
          <td colSpan={3} className="pl-8 pr-3 py-2 border-b border-slate-700/30">
            <div className="text-slate-300 font-medium">
              Materie: <span className="text-cyan-300">{subjectName}</span>
            </div>
            <div className="mt-2 space-y-2">
              {classDetails.map(detail => (
                <div key={`${teacher.name}-${subjectName}-${detail.className}`} 
                     className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 rounded-lg bg-slate-700/20 gap-2">
                  <span className="text-slate-400">Clasa: {detail.className}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">Numar de ore</span>
                    <input
                      type="number"
                      min="1"
                      value={detail.periodsPerWeek}
                      onChange={(e) => handlePeriodChange(detail.className, subjectName, e.target.value)}
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
  onUpdateLessonPeriods: (teacherName: string, className: string, subjectName: string, newPeriods: number) => boolean;
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
    <div className="rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 p-4 sm:p-8 shadow-xl border border-blue-500/20 backdrop-blur-sm">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h3 className="text-xl font-semibold text-blue-300 flex items-center">
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
            className="cursor-pointer rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-white flex items-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/20"
          >
            <span className="mr-2">📤</span>
            <span className="font-medium">Importă CSV</span>
          </label>

          <button
            onClick={handleExportToCSV}
            className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-white flex items-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/20"
          >
            <span className="mr-2">📥</span>
            <span className="font-medium">Exportă CSV</span>
          </button>
        </div>
      </div>

      {teachers.length > 0 ? (
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 text-slate-200">
                <th className="border-b border-slate-600/50 p-3 text-left font-medium tracking-wide">
                  Nume
                </th>
                <th className="border-b border-slate-600/50 p-3 text-left font-medium tracking-wide hidden sm:table-cell">
                  Disponibilitate
                </th>
                <th className="w-28 border-b border-slate-600/50 p-3 text-right sm:text-center font-medium tracking-wide">
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
          <span className="text-4xl mb-4">👨‍🏫</span>
          <p className="text-slate-300 mb-2 text-center">
            Nu există profesori adăugați încă. Adăugați primul profesor mai sus.
          </p>
          <p className="text-blue-400/80 text-sm text-center">
            Profesorii sunt necesari pentru a crea lecții și a genera orare.
          </p>
        </div>
      )}
    </div>
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
  } = useTeacherManagement(teachers, classes, onTeachersChange, onClassesChange);

  const handleImportTeachers = (importedTeachers: Teacher[]) => {
    if (importedTeachers.length > 0) {
      // Append imported teachers to existing ones
      onTeachersChange([...teachers, ...importedTeachers]);
      alert(`Au fost importați cu succes ${importedTeachers.length} profesori.`);
    } else {
      alert("Nu au fost găsiți profesori în fișierul importat.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl p-8">
      <h2 className="mb-4 md:mb-8 text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">
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

      <div className="mt-6 rounded-lg bg-blue-900/10 p-4 text-sm text-blue-300 border border-blue-500/10 backdrop-blur-sm">
        <p className="flex items-center flex-wrap">
          <span className="mr-2">ℹ️</span>
          Setați disponibilitatea fiecărui profesor apăsând pe "Setează Disponibilitate". Implicit, toate intervalele orare sunt disponibile.
        </p>
      </div>

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
