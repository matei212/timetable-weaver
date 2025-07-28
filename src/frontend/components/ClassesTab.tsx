import { FormEvent, useMemo, useState } from "react";
import {
  Class,
  Lesson,
  exportClassesToCSV,
  importClassesFromCSV,
} from "../../util/timetable";
import GradientButton from "./common/GradientButton";
import GradientContainer from "./common/GradientContainer";
import TextInput from "./common/TextInput";
import Note from "./common/Note";
import ColorButton from "./common/ColorButton";
import ThemeButton from "./common/ThemeButton";
import { PiClipboardText } from "react-icons/pi";
import { SiGoogleclassroom } from "react-icons/si";
import { HiOutlineBuildingLibrary } from "react-icons/hi2";

interface ClassesTabProps {
  classes: Class[];
  onClassesChange: (classes: Class[] | ((prev: Class[]) => Class[])) => void;
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

  const errorMsg = useMemo(() => {
    const name = newClassName.trim();
    if (classes.some(cls => cls.name === name)) {
      return `${newClassName} exista deja`;
    }
    return null;
  }, [classes, newClassName]);

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

  const handleImportCSV = async (file: File) => {
    try {
      const updatedClasses = await importClassesFromCSV(file);
      console.log(updatedClasses);
      onClassesChange(prev => {
        const out = [...prev];
        for (const cls of updatedClasses) {
          let exists = false;
          for (const c of out) {
            if (c.name === cls.name) {
              exists = true;
              break;
            }
          }
          if (exists) {
            continue;
          }
          out.push(cls);
        }
        return out;
      });
    } catch (error) {
      console.error("Error importing classes:", error);
      alert("Eroare la importarea claselor. Vă rugăm verificați fișierul CSV.");
    }
  };

  const handleExportToCSV = () => {
    exportClassesToCSV(classes, "classes.csv");
  };

  return (
    <div className="mx-auto w-full max-w-5xl p-8">
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
            d="M8 20v-9l-4 1.125V20h4Zm0 0h8m-8 0V6.66667M16 20v-9l4 1.125V20h-4Zm0 0V6.66667M18 8l-6-4-6 4m5 1h2m-2 3h2"
          />
        </svg>
        <span className="text-lg font-semibold">Gestionare Clase</span>
        <ThemeButton />
      </div>
      <GradientContainer className="mb-8 p-8">
        <h3 className="mb-6 flex items-center text-lg text-xl font-semibold">
          <span className="mr-3 text-2xl">
            <SiGoogleclassroom strokeWidth={0.1} />
          </span>{" "}
          Adaugă Clasă Nouă
        </h3>
        <form
          onSubmit={e => {
            e.preventDefault();
            handleAddClass();
          }}
          className="flex flex-col gap-3 md:flex-row"
        >
          <TextInput
            value={newClassName}
            onChange={e => setNewClassName(e.target.value)}
            placeholder="Numele clasei (ex., '10A', '11B')"
            className="flex-1 p-3"
          />
          <button
            disabled={errorMsg !== null}
            type="submit"
            className={`rounded-md bg-black px-6 py-3 font-medium text-white hover:bg-gray-400 ${errorMsg && "cursor-not-allowed bg-gray-400"}`}
          >
            Adaugă Clasă
          </button>
        </form>
        {errorMsg && <p className="mt-2 font-bold text-red-600">{errorMsg}</p>}
      </GradientContainer>
      <GradientContainer className="mb-8 p-8">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="mb-6 flex items-center text-lg text-xl font-semibold">
            <span className="mr-3 text-2xl">
              <PiClipboardText />
            </span>{" "}
            Listă Clase
          </h3>

          <div className="flex gap-3">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleImportCSV(e.target.files[0]);
                }
              }}
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

        {classes.length > 0 ? (
          <div className="relative overflow-hidden rounded-lg shadow-md">
            <table className="w-full table-fixed text-center">
              <thead>
                <tr className="bg-slate-200 dark:bg-slate-700/50 dark:text-slate-200">
                  <th className="border-b border-slate-600/50 p-3 text-center font-medium tracking-wide">
                    Nume
                  </th>
                  <th className="border-b border-slate-600/50 p-3 text-center font-medium tracking-wide">
                    Număr de Lecții
                  </th>
                  <th className="border-b border-slate-600/50 p-3 text-center font-medium tracking-wide">
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
                        <div className="flex items-center justify-around">
                          <span className="font-medium dark:text-slate-100">
                            {cls.name}
                          </span>
                          <ColorButton
                            onClick={() => handleStartEdit(index)}
                            className="px-2 py-2 text-sm"
                            variant="blue"
                          >
                            Editează Nume
                          </ColorButton>
                        </div>
                      )}
                    </td>
                    <td className="p-3 dark:text-slate-300">
                      {cls.lessons.length}
                    </td>
                    <td className="p-3 dark:text-slate-300">
                      {cls.getTotalPeriodsPerWeek()} ore
                    </td>
                    <td className="flex items-center justify-center p-3 text-center">
                      <button
                        className="group relative flex h-11 w-11 cursor-pointer items-center justify-start overflow-hidden rounded-full bg-red-600 shadow-lg transition-all duration-200 hover:w-25 hover:rounded-lg active:translate-x-1 active:translate-y-1"
                        onClick={() => handleRemoveClass(index)}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <HiOutlineBuildingLibrary className="mb-4 text-4xl" />
            <p className="mb-2 text-slate-300">
              Nu există clase adăugate încă. Adăugați prima clasă mai sus.
            </p>
            <p className="text-sm text-blue-400/80">
              Clasele sunt folosite pentru a organiza lecțiile și a crea orare.
            </p>
          </div>
        )}
      </GradientContainer>
      <Note className="mt-6 p-4">
        Notă: Veți atribui lecții claselor în secțiunea Lecții.
      </Note>
    </div>
  );
};

export default ClassesTab;
