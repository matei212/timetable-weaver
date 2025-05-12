import { useState } from "react";
import { Class, Lesson, exportClassesToCSV } from "../../util/timetable";

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
      <h2 className="mb-8 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
        Gestionare Clase
      </h2>

      <div className="mb-8 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 p-8 shadow-xl border border-blue-500/20 backdrop-blur-sm">
        <h3 className="mb-6 text-xl font-semibold text-blue-300 flex items-center">
          <span className="mr-3 text-2xl">🏛️</span> Adaugă Clasă Nouă
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={newClassName}
            onChange={e => setNewClassName(e.target.value)}
            placeholder="Numele clasei (ex., '10A', '11B')"
            className="flex-1 rounded-lg border border-slate-600/50 bg-slate-700/30 p-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
          />
          <button
            onClick={handleAddClass}
            className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 text-white font-medium shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all duration-300 hover:from-cyan-700 hover:to-blue-700"
          >
            Adaugă Clasă
          </button>
        </div>
      </div>

      {classes.length > 0 ? (
        <div className="rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 p-8 shadow-xl border border-blue-500/20 backdrop-blur-sm">
          <div className="mb-6 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-blue-300 flex items-center">
              <span className="mr-3 text-2xl">📋</span> Listă Clase
            </h3>
            <button
              onClick={handleExportToCSV}
              className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-white flex items-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/20"
            >
              <span className="mr-2">📥</span>
              <span className="font-medium">Exportă în CSV</span>
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 text-slate-200">
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
                    className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-all duration-300"
                  >
                    <td className="p-3">
                      {editingClassIndex === index ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingClassName}
                            onChange={e => setEditingClassName(e.target.value)}
                            className="flex-1 rounded-lg border border-slate-600/50 bg-slate-700/30 p-2 text-white transition-all focus:ring-2 focus:ring-blue-500/50"
                            autoFocus
                          />
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
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-100">{cls.name}</span>
                          <button
                            onClick={() => handleStartEdit(index)}
                            className="text-sm rounded-lg bg-blue-500/20 px-2 py-1 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 transition-all duration-300"
                          >
                            Editează
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-slate-300">
                      {cls.lessons.length}
                    </td>
                    <td className="p-3 text-slate-300">
                      {cls.getTotalPeriodsPerWeek()} de ore
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleRemoveClass(index)}
                        className="rounded-lg bg-red-500/20 px-3 py-1.5 text-red-300 hover:bg-red-500/30 hover:text-red-200 transition-all duration-300"
                      >
                        Șterge
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 p-8 text-center shadow-xl border border-blue-500/20 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center py-8">
            <span className="text-4xl mb-4">🏛️</span>
            <p className="text-slate-300 mb-2">
              Nu există clase adăugate încă. Adăugați prima clasă mai sus.
            </p>
            <p className="text-blue-400/80 text-sm">
              Clasele sunt folosite pentru a organiza lecțiile și a crea orare.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-lg bg-blue-900/10 p-4 text-sm text-blue-300 border border-blue-500/10 backdrop-blur-sm">
        <p className="flex items-center">
          <span className="mr-2">ℹ️</span>
          Notă: Veți atribui lecții claselor în secțiunea Lecții.
        </p>
      </div>
    </div>
  );
};

export default ClassesTab;
