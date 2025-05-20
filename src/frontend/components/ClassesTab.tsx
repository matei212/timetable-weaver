import { useState } from "react";
import { Class, Lesson, exportClassesToCSV } from "../../util/timetable";
import GradientButton from "./common/GradientButton";
import GradientContainer from "./common/GradientContainer";
import TextInput from "./common/TextInput";
import Note from "./common/Note";
import ColorButton from "./common/ColorButton";

interface ClassesTabProps {
  classes: Class[];
  onClassesChange: (classes: Class[]) => void;
}

const ClassesTab: React.FC<ClassesTabProps> = ({
  classes,
  onClassesChange,
}) => {
  const [newClassName, setNewClassName] = useState("");
  const [editingClassIndex, setEditingClassIndex] = useState<number | null>(
    null,
  );
  const [editingClassName, setEditingClassName] = useState("");

  const handleAddClass = () => {
    if (newClassName.trim()) {
      const newClass = new Class(newClassName.trim(), []);
      onClassesChange([...classes, newClass]);
      setNewClassName("");
    }
  };

  const handleRemoveClass = (index: number) => {
    const updatedClasses = [...classes];
    updatedClasses.splice(index, 1);
    onClassesChange(updatedClasses);
  };

  const handleStartEdit = (index: number) => {
    setEditingClassIndex(index);
    setEditingClassName(classes[index].name);
  };

  const handleSaveEdit = () => {
    if (editingClassIndex !== null && editingClassName.trim()) {
      const oldClassName = classes[editingClassIndex].name;
      const newClassName = editingClassName.trim();

      // If name hasn't changed, no need to update
      if (oldClassName === newClassName) {
        setEditingClassIndex(null);
        return;
      }

      const updatedClasses = [...classes];
      updatedClasses[editingClassIndex] = new Class(
        newClassName,
        updatedClasses[editingClassIndex].lessons,
      );
      onClassesChange(updatedClasses);
      setEditingClassIndex(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingClassIndex(null);
  };

  const handleExportToCSV = () => {
    exportClassesToCSV(classes, "classes.csv");
  };

  return (
    <div className="mx-auto w-full max-w-5xl p-8">
      <h2 className="text-gradient-blue mb-8 text-3xl font-bold">
        Gestionare Clase
      </h2>

      <GradientContainer className="mb-8 p-8">
        <h3 className="mb-6 flex items-center text-xl font-semibold text-blue-300">
          <span className="mr-3 text-2xl">🏛️</span> Adaugă Clasă Nouă
        </h3>
        <div className="flex gap-3">
          <TextInput
            value={newClassName}
            onChange={e => setNewClassName(e.target.value)}
            placeholder="Numele clasei (ex., '10A', '11B')"
            className="flex-1 p-3"
          />
          <GradientButton
            onClick={handleAddClass}
            variant="cyan"
            className="px-6 py-3 font-medium"
          >
            Adaugă Clasă
          </GradientButton>
        </div>
      </GradientContainer>

      {classes.length > 0 ? (
        <GradientContainer className="p-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center text-xl font-semibold text-blue-300">
              <span className="mr-3 text-2xl">📋</span> Listă Clase
            </h3>
            <GradientButton
              variant="green"
              onClick={handleExportToCSV}
              className="flex items-center justify-center px-4 py-2"
            >
              <span className="mr-2">📥</span>
              <span className="font-medium">Exportă în CSV</span>
            </GradientButton>
          </div>
          <div className="overflow-x-auto rounded-lg">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-200 dark:bg-slate-700/50 dark:text-slate-200">
                  <th className="border-b border-slate-600/50 p-3 text-left font-medium tracking-wide">
                    Nume
                  </th>
                  <th className="border-b border-slate-600/50 p-3 text-left font-medium tracking-wide">
                    Număr de Lecții
                  </th>
                  <th className="border-b border-slate-600/50 p-3 text-left font-medium tracking-wide">
                    Total de ore
                  </th>
                  <th className="w-32 border-b border-slate-600/50 p-3 text-center font-medium tracking-wide">
                    Acțiuni
                  </th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-700/50 transition-all duration-300 hover:bg-slate-400/10 dark:hover:bg-slate-700/20"
                  >
                    <td className="p-3">
                      {editingClassIndex === index ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingClassName}
                            onChange={e => setEditingClassName(e.target.value)}
                            className="flex-1 rounded-lg border border-slate-600/50 bg-slate-200 p-2 transition-all focus:ring-2 focus:ring-blue-500/50 dark:bg-slate-700/30 dark:text-white"
                            autoFocus
                          />
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
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="font-medium dark:text-slate-100">
                            {cls.name}
                          </span>
                          <ColorButton
                            onClick={() => handleStartEdit(index)}
                            className="px-2 py-1 text-sm"
                            variant="blue"
                          >
                            Editează
                          </ColorButton>
                        </div>
                      )}
                    </td>
                    <td className="p-3 dark:text-slate-300">
                      {cls.lessons.length}
                    </td>
                    <td className="p-3 dark:text-slate-300">
                      {cls.getTotalPeriodsPerWeek()} de ore
                    </td>
                    <td className="p-3 text-center">
                      <ColorButton
                        onClick={() => handleRemoveClass(index)}
                        variant="red"
                        className="px-3 py-1.5"
                      >
                        Șterge
                      </ColorButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GradientContainer>
      ) : (
        <GradientContainer className="p-8">
          <div className="flex flex-col items-center justify-center py-8">
            <span className="mb-4 text-4xl">🏛️</span>
            <p className="mb-2 text-slate-300">
              Nu există clase adăugate încă. Adăugați prima clasă mai sus.
            </p>
            <p className="text-sm text-blue-400/80">
              Clasele sunt folosite pentru a organiza lecțiile și a crea orare.
            </p>
          </div>
        </GradientContainer>
      )}

      <Note className="mt-6 p-4">
        Notă: Veți atribui lecții claselor în secțiunea Lecții.
      </Note>
    </div>
  );
};

export default ClassesTab;
