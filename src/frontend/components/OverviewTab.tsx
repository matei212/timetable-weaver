import React, { useMemo, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import ColorButton from "./common/ColorButton";
import GradientButton from "./common/GradientButton";
import ThemeButton from "./common/ThemeButton";
import { GoGear } from "react-icons/go";
import { RiAiGenerate } from "react-icons/ri";

import {
  exportAllDataToCSV,
  importAllDataFromCSV,
  generateExampleDataFile,
  Scheduler,
  Teacher,
  Class,
  Timetable,
} from "../../util/timetable";
import { AdvancedSettingsContext } from "../providers/AdvancedSettings";
import Modal from "./common/Modal";

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
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stats = useMemo(
    () => ({
      teachers: teachers.length,
      classes: classes.length,
      lessons: classes.reduce((sum, cls) => sum + cls.lessons.length, 0),
      timetables: 0,
    }),
    [teachers, classes],
  );
  const { advancedSettings, updateSettings } = useContext(
    AdvancedSettingsContext,
  );
  const [showAdvancedSettings, setShowAdvancedSettings] = React.useState(false);
  const [settingsDraft, setSettingsDraft] = React.useState(advancedSettings);

  const handleGenerateTimetable = () => {
    if (!classes.length || !teachers.length) {
      alert(
        "Trebuie să aveți cel puțin o clasă și un profesor pentru a genera un orar.",
      );
      return;
    }
    try {
      const scheduler = new Scheduler(classes, advancedSettings);
      const timetable = scheduler.generateTimetable();
      onTimetableGenerated(timetable);
    } catch (e) {
      alert("Nu s-a putut genera orarul. Verificați datele și încercați din nou.");
      console.error(e);
    }
  };

  const handleImportAllData = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const importedData = await importAllDataFromCSV(file);
      if (
        importedData.teachers.length === 0 &&
        importedData.classes.length === 0
      ) {
        alert(
          "Fișierul nu conținea date valide. Vă rugăm să utilizați fișierul exemplu ca șablon.",
        );
        return;
      }
      const replaceMessage = `A fost găsit ${importedData.teachers.length} profesori și ${importedData.classes.length} clase. Acest lucru va înlocui toate datele existente. Continuați?`;
      if (window.confirm(replaceMessage)) {
        onTeachersChange(importedData.teachers);
        onClassesChange(importedData.classes);
        alert("Datele au fost importate cu succes!");
      }
    } catch {
      alert(
        "Eroare la importul datelor. Vă rugăm să verificați formatul fișierului și încercați din nou. Verificați consola browserului pentru detalii.",
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExportAllData = () => {
    exportAllDataToCSV(teachers, classes, "timetable-weaver-data.csv");
  };

  const handleAdvancedSettings = () => {
    setSettingsDraft(advancedSettings);
    setShowAdvancedSettings(true);
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setSettingsDraft(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSaveSettings = () => {
    updateSettings(settingsDraft);
    setShowAdvancedSettings(false);
  };

  const handleCancelSettings = () => {
    setShowAdvancedSettings(false);
  };

  const handleGenerateExampleFile = () => {
    generateExampleDataFile();
  };

  const card = "rounded-xl border bg-white  p-6 shadow-sm flex flex-col gap-2";
  const primaryButton =
    "w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors bg-black text-white  hover:bg-gray-800 ";

  return (
    <>
      <header className="mb-2 flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <svg
            className="h-6 w-6 text-gray-800"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-3 5h3m-6 0h.01M12 16h3m-6 0h.01M10 3v4h4V3h-4Z"
            />
          </svg>

          <span className="text-lg font-semibold">Tablou de bord</span>
        </div>
        <ThemeButton />
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-xl border bg-gray-50 p-6">
            <h2 className="mb-4 text-2xl font-bold">
              Bine ai venit la Timetable Weaver
            </h2>
            <p className="mb-4 text-gray-500">
              Gestionează orarele școlii tale eficient cu sistemul nostru automatizat de programare.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleGenerateTimetable}
                className={primaryButton}
              >
                <svg
                  className="h-6 w-6 text-white"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 10h16m-8-3V4M7 7V4m10 3V4M5 20h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Zm3-7h.01v.01H8V13Zm4 0h.01v.01H12V13Zm4 0h.01v.01H16V13Zm-8 4h.01v.01H8V17Zm4 0h.01v.01H12V17Zm4 0h.01v.01H16V17Z"
                  />
                </svg>
                Generează orar
              </button>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="flex flex-col gap-1 rounded-xl border-blue-200 bg-blue-50/30 p-4 shadow-sm">
              <div className="flex flex-row items-center justify-between pb-2">
                <span className="stats text-sm font-medium text-blue-700">
                  Profesori
                </span>
                <span>
                  <svg
                    className=""
                    width="24"
                    height="24"
                    fill="none"
                    stroke="#2563eb"
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
                </span>
              </div>
              <div className="stats text-2xl font-bold text-blue-800">
                {stats.teachers}
              </div>
              <p className="noninv text-xs text-blue-600">
                Cadre didactice active
              </p>
            </div>
            <div className="flex flex-col gap-1 rounded-xl border-cyan-200 bg-cyan-50/30 p-4 shadow-sm">
              <div className="flex flex-row items-center justify-between pb-2">
                <span className="stats text-sm font-medium text-cyan-700">
                  Clase
                </span>
                <svg
                  className="h-6 w-6 text-gray-800"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="#06b6d4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 20v-9l-4 1.125V20h4Zm0 0h8m-8 0V6.66667M16 20v-9l4 1.125V20h-4Zm0 0V6.66667M18 8l-6-4-6 4m5 1h2m-2 3h2"
                  />
                </svg>
              </div>
              <div className="stats text-2xl font-bold text-cyan-800">
                {stats.classes}
              </div>
              <p className="text-xs text-cyan-600">Total clase</p>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="flex flex-col gap-1 rounded-xl border-indigo-200 bg-indigo-50/30 p-4 shadow-sm">
              <div className="flex flex-row items-center justify-between pb-2">
                <span className="stats text-sm font-medium text-indigo-700">
                  Lecții
                </span>
                <span>
                  <svg
                    className="h-6 w-6 text-gray-800"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="#6366f1"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="m17 21-5-4-5 4V3.889a.92.92 0 0 1 .244-.629.808.808 0 0 1 .59-.26h8.333a.81.81 0 0 1 .589.26.92.92 0 0 1 .244.63V21Z"
                    />
                  </svg>
                </span>
              </div>
              <div className="stats text-2xl font-bold text-indigo-800">
                {stats.lessons}
              </div>
              <p className="text-xs text-indigo-600">Lecții programate</p>
            </div>
            <div className="flex flex-col gap-1 rounded-xl border-green-200 bg-green-50/30 p-4 shadow-sm">
              <div className="flex flex-row items-center justify-between pb-2">
                <span className="stats text-sm font-medium text-green-700">
                  Orar(e)
                </span>
                <span>
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <rect width="18" height="18" x="3" y="4" rx="2" />
                    <path d="M16 2v4" />
                    <path d="M8 2v4" />
                    <path d="M3 10h18" />
                  </svg>
                </span>
              </div>
              <div className="stats text-2xl font-bold text-green-800">
                {stats.timetables}
              </div>
              <p className="text-xs text-green-600">Orare generate</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className={card}>
            <h3 className="mb-1 text-lg font-bold text-black">Acțiuni rapide</h3>
            <div className="mb-4 text-sm text-gray-400">
              Activități și operațiuni comune
            </div>
            <div className="flex flex-col gap-2">
              <GradientButton
                variant="gray"
                onClick={() => navigate("/teachers")}
                className="flex px-4 py-2 text-sm font-medium text-black"
              >
                <span className="mr-2">
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="#2563eb"
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
                </span>
                <span className="font-medium text-black">Gestionează profesorii</span>
              </GradientButton>

              <GradientButton
                variant="gray"
                onClick={() => navigate("/classes")}
                className="flex px-4 py-2 text-sm font-medium text-black"
              >
                <svg
                  className="h-6 w-6 text-gray-800"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="#06b6d4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 20v-9l-4 1.125V20h4Zm0 0h8m-8 0V6.66667M16 20v-9l4 1.125V20h-4Zm0 0V6.66667M18 8l-6-4-6 4m5 1h2m-2 3h2"
                  />
                </svg>

                <span className="font-medium text-black">Gestionează clasele</span>
              </GradientButton>

              <GradientButton
                variant="gray"
                onClick={() => navigate("/lessons")}
                className="flex px-4 py-2 text-sm font-medium text-black"
              >
                <span>
                  <svg
                    className="h-6 w-6 text-gray-800"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="#6366f1"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="m17 21-5-4-5 4V3.889a.92.92 0 0 1 .244-.629.808.808 0 0 1 .59-.26h8.333a.81.81 0 0 1 .589.26.92.92 0 0 1 .244.63V21Z"
                    />
                  </svg>
                </span>
                <span className="font-medium text-black">Gestionează lecțiile</span>
              </GradientButton>
            </div>
          </div>

          <div className={card}>
            <h3 className="mb-1 text-lg font-bold">Administrare date</h3>
            <div className="mb-4 text-sm text-gray-400">
              Importează și exportă datele tale
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="import-file"
              />

              <GradientButton
                variant="gray"
                onClick={handleImportAllData}
                className="flex px-4 py-2 text-sm font-medium text-black"
              >
                <span className="mr-2">
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="#64748b"
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
                <span className="font-medium text-black">Importă date</span>
              </GradientButton>

              <GradientButton
                variant="gray"
                onClick={handleExportAllData}
                className="flex px-4 py-2 text-sm font-medium text-black"
              >
                <span className="mr-2">
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="#64748b"
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

                <span className="font-medium text-black">Exportă date</span>
              </GradientButton>

              <GradientButton
                variant="gray"
                onClick={handleAdvancedSettings}
                className="flex px-4 py-2 text-sm font-medium text-black"
              >
                <span className="mr-2">
                  <GoGear color="#64748b" size="20px" strokeWidth={0.35} />
                </span>
                <span className="font-medium text-black">
                  Setări avansate
                </span>
              </GradientButton>

              <GradientButton
                variant="gray"
                onClick={handleGenerateExampleFile}
                className="flex px-4 py-2 text-sm font-medium text-black"
              >
                <span className="mr-2">
                  <RiAiGenerate color="#64748b" size="20px" />
                </span>
                <span className="font-medium text-black">
                  Generează fișier exemplu de date
                </span>
              </GradientButton>
            </div>
          </div>
        </div>
      </div>
      {showAdvancedSettings && (
        <Modal isOpen={showAdvancedSettings} onClose={handleCancelSettings}>
          <div className="} w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            {" "}
            <h2 className="mb-4 text-lg font-bold">Setări avansate</h2>
            <form className="flex flex-col gap-3">
              {Object.entries(settingsDraft).map(([key, value]) => (
                <label key={key} className="flex flex-col gap-1 text-sm">
                  <span className="font-medium capitalize">
                    {key.replace(/([A-Z])/g, " $1")}
                  </span>
                  <input
                    type="number"
                    name={key}
                    value={value}
                    onChange={handleSettingsChange}
                    className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              ))}
            </form>
            <div className="mt-6 flex justify-end gap-2">
              <ColorButton variant="gray" onClick={handleCancelSettings}>
                Anulează
              </ColorButton>
              <GradientButton variant="blue" onClick={handleSaveSettings}>
                Salvează
              </GradientButton>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
export default OverviewTab;
