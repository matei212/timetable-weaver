import React, {
  useMemo,
  useRef,
  useContext,
  PropsWithChildren,
  useCallback,
  ChangeEvent,
  useState,
  useTransition,
} from "react";
import { useNavigate } from "react-router-dom";
import ColorButton from "./common/ColorButton";
import GradientButton from "./common/GradientButton";
import ThemeButton from "./common/ThemeButton";
import { GoGear } from "react-icons/go";
import { RiAiGenerate, RiResetRightFill } from "react-icons/ri";

import {
  exportAllDataToCSV,
  importAllDataFromCSV,
  generateExampleDataFile,
  Scheduler,
  Teacher,
  Class,
  Timetable,
  Availability,
  Lesson,
  SchedulerConfig,
  DEFAULT_SCHEDULER_CONFIG,
  DAYS,
  PERIODS_PER_DAY,
} from "../../util/timetable";
import { AdvancedSettingsContext } from "../providers/AdvancedSettings";
import Modal from "./common/Modal";
import GradientContainer from "./common/GradientContainer";
import Background from "./common/Background";
import LoadingIcon from "./common/LoadingIcon";
import {
  updateTimetableTeachers,
  updateTimetableClasses,
  updateTimetableLessons,
  fetchTeachersForTimetable,
  fetchGradesForTimetable,
  fetchLessonsForTimetable,
  FetchedLesson,
} from "../services/firestoreUtils";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../services/firebase";

interface OverviewTabProps {
  classes: Class[];
  teachers: Teacher[];
  onTimetableGenerated: (timetable: Timetable | null) => void;
  onTeachersChange: (teachers: Teacher[]) => void;
  onClassesChange: (classes: Class[] | ((prev: Class[]) => Class[])) => void;
  timetableId?: string;
  timetableName?: string;
  isOwner?: boolean | null;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  classes,
  teachers,
  onTimetableGenerated,
  onTeachersChange,
  onClassesChange,
  timetableId,
  timetableName,
  isOwner,
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
  const { advancedSettings } = useContext(AdvancedSettingsContext);
  const [isLoading, startTransition] = useTransition();
  const [user] = useAuthState(auth);
  const [saveStatus, setSaveStatus] = useState<string>("");

  const createTimetable = () => {
    try {
      const scheduler = new Scheduler(classes, advancedSettings);
      const timetable = scheduler.generateTimetable();
      onTimetableGenerated(timetable);
    } catch (e) {
      alert(
        "Nu s-a putut genera orarul. Verificați datele și încercați din nou.",
      );
      console.error(e);
    }
  };

  const handleGenerateTimetable = () => {
    if (!classes.length || !teachers.length) {
      alert(
        "Trebuie să aveți cel puțin o clasă și un profesor pentru a genera un orar.",
      );
      return;
    }

    startTransition(createTimetable);
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

  const handleGenerateExampleFile = () => {
    generateExampleDataFile();
  };

  const handleSaveOnline = async () => {
    if (!user) {
      setSaveStatus("Trebuie să fii autentificat pentru a salva online.");
      return;
    }
    if (!timetableId) {
      setSaveStatus(
        "Trebuie să selectezi un orar din pagina principală pentru a salva datele!",
      );
      return;
    }
    try {
      // salvare teachers, classes  si lessons
      await Promise.all([
        updateTimetableTeachers(timetableId, teachers),
        updateTimetableClasses(timetableId, classes),
        updateTimetableLessons(timetableId, classes),
      ]);
      setSaveStatus(
        "Profesorii, clasele, lecțiile și disponibilitatea au fost salvate la orarul selectat!",
      );
    } catch (e) {
      setSaveStatus("Eroare la salvarea online: " + (e as Error).message);
    }
  };

  const handleImportOnline = async () => {
    if (!user) {
      setSaveStatus("Trebuie să fii autentificat pentru a importa date.");
      return;
    }

    if (!timetableId) {
      setSaveStatus(
        "Trebuie să selectezi un orar din pagina principală pentru a importa datele!",
      );
      return;
    }

    if (
      !window.confirm(
        "Ești sigur că vrei să imporți datele din online? Toate datele locale nesalvate (profesori, clase, lecții) vor fi suprascrise.",
      )
    ) {
      return;
    }

    setSaveStatus("Se importă datele...");

    try {
      // get all data in parallel
      const [teachersData, gradesData, lessonsData] = await Promise.all([
        fetchTeachersForTimetable(timetableId),
        fetchGradesForTimetable(timetableId),
        fetchLessonsForTimetable(timetableId),
      ]);

      // Reconstruct Teachers into proper class instances
      const importedTeachers = teachersData.map(t => {
        const availability = new Availability(DAYS, PERIODS_PER_DAY);

        if (t.availability) {
          let bufferValues: number[] | null = null;
          const availabilityData = t.availability as { [key: string]: unknown };

          // Check for the NEW format first: { availability: { buffer: { 0: val, ... } } }
          if (
            availabilityData.buffer &&
            typeof availabilityData.buffer === "object"
          ) {
            bufferValues = Object.values(
              availabilityData.buffer as { [key: string]: number },
            );
          }
          // ELSE, check for the OLD format: { availability: { day_0: val, ... } }
          else {
            bufferValues = Object.keys(availabilityData)
              .filter(key => key.startsWith("day_"))
              .sort(
                (a, b) => parseInt(a.split("_")[1]) - parseInt(b.split("_")[1]),
              )
              .map(key => availabilityData[key] as number);
          }

          if (bufferValues && bufferValues.length > 0) {
            // The Availability class expects a standard number array for its buffer
            availability.buffer = bufferValues;
          }
        }

        const newTeacher = new Teacher(t.name, availability, t.email || undefined);
        newTeacher.id = t.name; // Use teacher name as ID since that's the document ID in Firestore
        
        // Debug: Log teacher data to verify email loading
        if (t.email) {
          console.log(`Loaded teacher ${t.name} with email: ${t.email}`);
        }
        
        return newTeacher;
      });

      const teachersMap = new Map(importedTeachers.map(t => [t.name, t]));

      // Reconstruct Classes and their Lessons into proper class instances
      const importedClasses = gradesData.map(g => {
        const classLessonsData = lessonsData.find(l => l.className === g.name);
        const lessons: Lesson[] = [];

        if (classLessonsData && classLessonsData.lessons) {
          classLessonsData.lessons.forEach((lessonDoc: FetchedLesson) => {
            let lesson: Lesson | undefined = undefined;
            // Reconstruct based on lesson type
            if (lessonDoc.type === "normal" && lessonDoc.teacher) {
              const teacher = teachersMap.get(lessonDoc.teacher);
              if (teacher && lessonDoc.name) {
                lesson = {
                  type: "normal",
                  name: lessonDoc.name,
                  teacher: teacher, // Use the actual Teacher instance
                  periodsPerWeek: lessonDoc.periodsPerWeek,
                };
              }
            } else if (lessonDoc.type === "alternating" && lessonDoc.teachers) {
              const teacher1 = teachersMap.get(lessonDoc.teachers[0]);
              const teacher2 = teachersMap.get(lessonDoc.teachers[1]);
              if (teacher1 && teacher2 && lessonDoc.names) {
                lesson = {
                  type: "alternating",
                  names: lessonDoc.names,
                  teachers: [teacher1, teacher2], // Use Teacher instances
                  periodsPerWeek: lessonDoc.periodsPerWeek,
                };
              }
            } else if (lessonDoc.type === "group" && lessonDoc.teachers) {
              const teacher1 = teachersMap.get(lessonDoc.teachers[0]);
              const teacher2 = teachersMap.get(lessonDoc.teachers[1]);
              if (teacher1 && teacher2 && lessonDoc.name) {
                lesson = {
                  type: "group",
                  name: lessonDoc.name,
                  teachers: [teacher1, teacher2], // Use Teacher instances
                  periodsPerWeek: lessonDoc.periodsPerWeek,
                };
              }
            }
            if (lesson) {
              lessons.push(lesson);
            }
          });
        }
        // Create a new Class instance
        return new Class(g.name, lessons);
      });

      // Save teacher emails to localStorage
      importedTeachers.forEach(teacher => {
        if (teacher.email) {
          localStorage.setItem(`teacher_email_${teacher.name}`, teacher.email);
        }
      });

      // Update the global state with the new class instances
      onTeachersChange(importedTeachers);
      onClassesChange(importedClasses);

      setSaveStatus("Datele au fost importate cu succes!");
    } catch (e) {
      setSaveStatus("Eroare la importarea datelor: " + (e as Error).message);
      console.error("Error during online import:", e);
    }
  };

  const card = "rounded-xl border bg-white  p-6 shadow-sm flex flex-col gap-2";

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
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-3 5h3m-6 0h.01M12 16h3m-6 0h.01M10 3v4h4V3h-4Z"
            />
          </svg>

          <span className="text-lg font-semibold">Tablou de bord</span>
        </div>
        <ThemeButton />
      </header>

      {isLoading && (
        <Background className="grid place-items-center">
          <LoadingIcon />
        </Background>
      )}

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-xl border bg-gray-50 p-6">
            <h2 className="mb-4 text-2xl font-bold">
              Bine ai venit la Timetable Weaver
            </h2>
            {timetableName && (
              <div className="mb-3 rounded-lg bg-blue-50 p-3">
                <h3 className="font-semibold text-blue-800">
                  Orar: {timetableName}
                </h3>
                {isOwner ? (
                  <p className="text-sm text-blue-600">
                    👑 Proprietar - Aveți acces complet la acest orar
                  </p>
                ) : (
                  <p className="text-sm text-orange-600">
                    📋 Asignat - Acces limitat la acest orar
                  </p>
                )}
              </div>
            )}
            <p className="mb-4 text-gray-500">
              Gestionează orarele școlii tale eficient cu sistemul nostru
              automatizat de programare.
            </p>
            <div className="flex flex-wrap gap-2">
              <GradientButton
                onClick={handleGenerateTimetable}
                disabled={isLoading}
                className="flex-grow"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <LoadingIcon /> Se generează...
                  </div>
                ) : (
                  "Generează orar"
                )}
              </GradientButton>
              <GradientButton
                variant="cyan"
                onClick={handleSaveOnline}
                className="flex-grow"
              >
                Salvează online
              </GradientButton>
              <GradientButton
                variant="blue"
                onClick={handleImportOnline}
                className="flex-grow"
              >
                Importă din online
              </GradientButton>
            </div>
            {saveStatus && (
              <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                {saveStatus}
              </div>
            )}
          </div>
          <div className="grid gap-4">
            <div className="flex flex-col gap-1 rounded-xl border-blue-200 bg-blue-50/30 p-4 shadow-sm">
              <div className="flex flex-row items-center justify-between pb-2">
                <span className="stats text-sm font-medium text-blue-700">
                  Profesori
                </span>
                <GradientButton
                  variant="colapse"
                  onClick={() => navigate("/teachers")}
                  className="margine flex px-4 py-2 text-sm font-medium text-black md:hidden"
                >
                  Gestioneaza
                </GradientButton>
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
                <GradientButton
                  variant="colapse"
                  onClick={() => navigate("/classes")}
                  className="flex px-4 py-2 text-sm font-medium text-black md:hidden"
                >
                  Gestioneaza
                </GradientButton>
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
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
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
                <GradientButton
                  variant="colapse"
                  onClick={() => navigate("/lessons")}
                  className="flex px-4 py-2 text-sm font-medium text-black md:hidden"
                >
                  Gestioneaza
                </GradientButton>
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
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
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
          <div className={`${card} hidden md:grid`}>
            <h3 className="mb-1 text-lg font-bold text-black">
              Acțiuni rapide
            </h3>
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
                <span className="font-medium text-black">
                  Gestionează profesorii
                </span>
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
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 20v-9l-4 1.125V20h4Zm0 0h8m-8 0V6.66667M16 20v-9l4 1.125V20h-4Zm0 0V6.66667M18 8l-6-4-6 4m5 1h2m-2 3h2"
                  />
                </svg>

                <span className="font-medium text-black">
                  Gestionează clasele
                </span>
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
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m17 21-5-4-5 4V3.889a.92.92 0 0 1 .244-.629.808.808 0 0 1 .59-.26h8.333a.81.81 0 0 1 .589.26.92.92 0 0 1 .244.63V21Z"
                    />
                  </svg>
                </span>
                <span className="font-medium text-black">
                  Gestionează lecțiile
                </span>
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

              <AdvancedSettings />

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
    </>
  );
};
export default OverviewTab;

type SectionProps = { title: string } & PropsWithChildren;
const Section = ({ title, children }: SectionProps) => {
  return (
    <div className="space-y-1">
      <h3 className="text-lg font-bold">{title}</h3>
      {children}
    </div>
  );
};

type SettingProp = {
  title: string;
  description?: string;
  valuePath: keyof SchedulerConfig;
  min?: number;
  max?: number;
  step?: number;
};
const Setting = ({
  title,
  description,
  valuePath,
  min,
  max,
  step,
}: SettingProp) => {
  const { advancedSettings: settings, updateSettings } = useContext(
    AdvancedSettingsContext,
  );
  const value = useMemo(() => settings[valuePath], [settings, valuePath]);
  const isDefaultSetting = useMemo(
    () => value === DEFAULT_SCHEDULER_CONFIG[valuePath],
    [value, valuePath],
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value);
      updateSettings({ [valuePath]: newValue });
    },
    [updateSettings, valuePath],
  );

  const handleReset = useCallback(() => {
    const defaultVal = DEFAULT_SCHEDULER_CONFIG[valuePath];
    updateSettings({ [valuePath]: defaultVal });
  }, [updateSettings, valuePath]);

  return (
    <div className="flex items-start justify-between gap-8">
      <div className="w-full">
        <h4 className="font-medium capitalize">{title}</h4>
        {description && (
          <p className="tex-xs md:show hidden text-gray-700 md:block">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {!isDefaultSetting && (
          <RiResetRightFill
            onClick={handleReset}
            className="text-xl text-gray-700 transition-colors hover:text-gray-600"
          />
        )}
        <input
          type="number"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className="w-33 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

const AdvancedSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const handleOpenModal = useCallback(() => setIsOpen(true), []);

  return (
    <>
      <GradientButton
        variant="gray"
        onClick={handleOpenModal}
        className="flex px-4 py-2 text-sm font-medium text-black"
      >
        <span className="mr-2">
          <GoGear color="#64748b" size="20px" strokeWidth={0.35} />
        </span>
        <span className="font-medium text-black">Setări avansate</span>
      </GradientButton>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <GradientContainer className="px-3 py-4 sm:min-w-lg md:min-w-3xl lg:min-w-4xl">
          <form method="dialog" className="space-y-4">
            <h2 className="text-4xl font-bold">Setări Avansate</h2>
            <Setting
              title="Initial Pool Size"
              description="Câte generări să facă algoritmul la început"
              min={1}
              max={100}
              step={1}
              valuePath="initialPoolSize"
            />

            <Section title="ES (1 + 1)">
              <Setting
                title="Max Iterations"
                description="Numar maxim de iterații ale algoritmului"
                min={100}
                step={50}
                valuePath="maxESIterations"
              />
              <Setting
                title="Sigma"
                description="Rata de schimbare inițială"
                min={0.1}
                max={5.0}
                step={0.1}
                valuePath="sigma"
              />
              <Setting
                title="Sigma Decay"
                description="Rata de scădere a lui sigma"
                min={0.1}
                max={0.99}
                step={0.01}
                valuePath="sigmaDecay"
              />
              <Setting
                title="Min Sigma"
                description="Valoarea minimă pe care o poate avea sigma"
                min={0.1}
                max={5.0}
                step={0.1}
                valuePath="minSigma"
              />
              <Setting
                title="Max Stagnant Iterations"
                description="Numărul de iterați stagnante după care algoritmul devine mai agresiv"
                min={100}
                max={1000}
                step={50}
                valuePath="maxStagnantIterations"
              />
            </Section>

            <Section title="Annealing">
              <Setting
                title="Temperature"
                description="Temperatura cu care algoritmul începe"
                min={0.1}
                max={1.0}
                step={0.01}
                valuePath="temperature"
              />
              <Setting
                title="Cooling Rate"
                description="Rata de răcrire care moidifică temperatura"
                min={0.1}
                max={0.99}
                step={0.01}
                valuePath="coolingRate"
              />
              <Setting
                title="Min Temperature"
                description="Valoare minimă pe care o poate avea temperatura"
                min={0.00001}
                max={0.99999}
                step={0.00001}
                valuePath="minTemperature"
              />
            </Section>

            <div className="flex justify-end gap-4 text-lg">
              <ColorButton variant="gray" className="px-2 py-1">
                Anulează
              </ColorButton>
              <ColorButton variant="green" className="px-2 py-1">
                Salvează
              </ColorButton>
            </div>
          </form>
        </GradientContainer>
      </Modal>
    </>
  );
};
