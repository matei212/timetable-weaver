import { useNavigate } from "react-router-dom";
import ThemeButton from "../components/common/ThemeButton";
import { useEffect, useState, useRef } from "react";
import { fetchUserTimetables } from "../services/firestoreUtils";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../services/firebase";
import TeacherAvailabilityEditor from "../components/TeacherAvailabilityEditor";

interface Timetable {
  id: string;
  title: string;
  owner: string;
  isOwner: boolean;
  isTeacher?: boolean;
  createdAt?: Date;
}

interface HomeProps {
  storageAvailable: boolean;
  hasData: boolean;
  onClearData: () => void;
  onForceSave: () => void;
  onCreateTimetable: (timetableId?: string, timetableName?: string) => void;
}

const Home: React.FC<HomeProps> = ({
  storageAvailable,
  hasData,
  onClearData,
  onForceSave,
  onCreateTimetable,
}) => {
  const navigate = useNavigate();
  const [user, authLoading] = useAuthState(auth);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [teacherTimetableId, setTeacherTimetableId] = useState<string>("");
  const [showAvailabilityEditor, setShowAvailabilityEditor] = useState(false);
  const [showTimetableDropdown, setShowTimetableDropdown] = useState(false);
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const timetableDropdownRef = useRef<HTMLDivElement>(null);
  const teacherDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      const loadTimetables = async () => {
        try {
          const data = await fetchUserTimetables(
            user.uid,
            user.email || undefined,
          );
          const allTimetables = [
            ...data.owned.map(tt => ({
              id: tt.id,
              title: tt.title || "(fără titlu)",
              owner: tt.owner || "necunoscut",
              isOwner: true,
              isTeacher: false,
              createdAt: tt.createdAt,
            })),
            ...data.assigned.map(tt => ({
              id: tt.id,
              title: tt.title || "(fără titlu)",
              owner: tt.owner || "necunoscut",
              isOwner: false,
              isTeacher: false,
              createdAt: tt.createdAt,
            })),
            ...data.teacherIn.map(tt => ({
              id: tt.id,
              title: tt.title || "(fără titlu)",
              owner: tt.owner || "necunoscut",
              isOwner: false,
              isTeacher: true,
              createdAt: tt.createdAt,
            })),
          ];
          setTimetables(allTimetables);

          const teacherTimetables = allTimetables.filter(tt => tt.isTeacher);
          if (teacherTimetables.length > 0) {
            setIsTeacher(true);
            setTeacherTimetableId(teacherTimetables[0].id);
          }
        } catch (error) {
          console.error("Error fetching timetables:", error);
        } finally {
          setLoading(false);
        }
      };

      loadTimetables();
    } else {
      setTimetables([]);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        timetableDropdownRef.current &&
        !timetableDropdownRef.current.contains(event.target as Node)
      ) {
        setShowTimetableDropdown(false);
      }
      if (
        teacherDropdownRef.current &&
        !teacherDropdownRef.current.contains(event.target as Node)
      ) {
        setShowTeacherDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCreateTimetable = () => {
    const selectedTimetableData = timetables.find(
      tt => tt.id === selectedTimetable,
    );

    if (isTeacher && selectedTimetableData?.isTeacher) {
      setTeacherTimetableId(selectedTimetable);
      setShowAvailabilityEditor(true);
      return;
    }

    onCreateTimetable(selectedTimetable, selectedTimetableData?.title);
    navigate("/overview");
  };

  if (authLoading) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center">
        <div className="mb-4">Se încarcă...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center">
        <ThemeButton />
        <h1 className="mb-6 text-3xl font-bold dark:text-white">
          Bine ați venit la Timetable Weaver
        </h1>
        <p className="mb-8 text-gray-700">
          Vă rugăm să vă autentificați pentru a accesa orarele.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="rounded-lg border border-blue-500/10 bg-blue-300/30 px-6 py-3 text-lg font-medium text-blue-400 backdrop-blur-sm"
        >
          Autentificare
        </button>
      </div>
    );
  }

  if (isTeacher) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center">
        <ThemeButton />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 200 200"
          width="100px"
          height="100px"
          className="logo stats mx-auto mb-8"
        >
          <svg
            stroke="black"
            fill="currentColor"
            strokeWidth="0"
            viewBox="0 0 24 24"
            height="200px"
            width="200px"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="none"
              strokeWidth="2"
              d="M8,5 L8,23 M16,5 L16,23 M1,11 L23,11 M1,5 L23,5 M1,17 L23,17 M1,1 L23,1 L23,23 L1,23 L1,1 Z"
            ></path>
          </svg>

          <g transform="translate(25, 25) scale(10)">
            <path
              d="M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09z"
              fill="yellow"
            ></path>
          </g>
        </svg>
        <h1 className="mb-6 text-3xl font-bold dark:text-white">
          Bine ați venit la Timetable Weaver
        </h1>
        <p className="mb-4 text-gray-700">Bine ați venit, {user.email}!</p>
        <p className="mb-8 text-gray-700">
          Ați fost identificat ca profesor. Puteți edita disponibilitatea
          dumneavoastră.
        </p>

        {loading ? (
          <div className="mb-4">Se încarcă orarele...</div>
        ) : (
          <>
            {timetables.filter(tt => tt.isTeacher).length > 0 && (
              <div className="mb-4">
                <label className="mb-2 block font-medium">
                  Selectează orarul pentru editarea disponibilității:
                </label>
                <div className="relative" ref={teacherDropdownRef}>
                  <button
                    onClick={() => setShowTeacherDropdown(!showTeacherDropdown)}
                    className="inline-flex w-full items-center justify-between rounded-lg bg-blue-300/30 px-5 py-2.5 text-center text-sm font-medium text-blue-500 hover:bg-blue-100 focus:ring-4 focus:ring-blue-300 focus:outline-none dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    type="button"
                  >
                    {teacherTimetableId
                      ? timetables.find(tt => tt.id === teacherTimetableId)
                          ?.title || "Selectează orarul"
                      : "Selectează orarul"}
                    <svg
                      className="ms-3 h-2.5 w-2.5"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 10 6"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m1 1 4 4 4-4"
                      />
                    </svg>
                  </button>

                  {showTeacherDropdown && (
                    <div className="absolute top-full right-0 left-0 z-10 mt-1 w-full divide-y divide-gray-100 rounded-lg bg-white shadow-sm dark:bg-gray-700">
                      <ul
                        className="py-2 text-sm text-gray-700 dark:text-gray-200"
                        aria-labelledby="dropdownDefaultButton"
                      >
                        {timetables
                          .filter(tt => tt.isTeacher)
                          .map(tt => (
                            <li key={tt.id}>
                              <button
                                onClick={() => {
                                  setTeacherTimetableId(tt.id);
                                  setShowTeacherDropdown(false);
                                }}
                                className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                              >
                                {tt.title} (Proprietar: {tt.owner})
                              </button>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <button
                onClick={() => setShowAvailabilityEditor(true)}
                className="rounded-lg border border-blue-500/10 bg-blue-300/30 px-6 py-3 text-lg font-medium text-blue-400 backdrop-blur-sm"
                disabled={!teacherTimetableId}
              >
                Editează Disponibilitatea
              </button>

              <button
                onClick={() => auth.signOut()}
                className="rounded-lg border border-red-500/10 bg-red-200 px-6 py-3 text-lg font-medium text-red-600 backdrop-blur-sm"
              >
                Deconectare
              </button>
            </div>
          </>
        )}

        {showAvailabilityEditor && (
          <TeacherAvailabilityEditor
            timetableId={teacherTimetableId}
            onClose={() => setShowAvailabilityEditor(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6 text-center">
      <ThemeButton />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 200"
        width="100px"
        height="100px"
        className="logo stats mx-auto mb-8"
      >
        <svg
          stroke="black"
          fill="currentColor"
          strokeWidth="0"
          viewBox="0 0 24 24"
          height="200px"
          width="200px"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="none"
            strokeWidth="2"
            d="M8,5 L8,23 M16,5 L16,23 M1,11 L23,11 M1,5 L23,5 M1,17 L23,17 M1,1 L23,1 L23,23 L1,23 L1,1 Z"
          ></path>
        </svg>

        <g transform="translate(25, 25) scale(10)">
          <path
            d="M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09z"
            fill="none"
            className="lightning"
          ></path>
        </g>
      </svg>
      <h1 className="mb-6 text-3xl font-bold dark:text-white">
        Bine ați venit la Timetable Weaver
      </h1>
      <p className="mb-4 text-gray-700">Bine ați venit, {user.email}!</p>
      <p className="mb-8 text-gray-700">
        Creați orare optime pentru școala sau instituția dumneavoastră cu
        sistemul nostru inteligent de programare.
      </p>

      {loading ? (
        <div className="mb-4">Se încarcă orarele existente...</div>
      ) : (
        <div className="mb-4">
          <label className="mb-2 block font-medium">
            Selectează orarul de editat:
          </label>
          <div className="relative" ref={timetableDropdownRef}>
            <button
              onClick={() => setShowTimetableDropdown(!showTimetableDropdown)}
              className="inline-flex w-full items-center justify-between rounded-lg bg-blue-300/30 px-5 py-2.5 text-center text-sm font-medium text-blue-500 hover:bg-blue-100 focus:ring-4 focus:ring-blue-300 focus:outline-none dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              type="button"
            >
              {selectedTimetable
                ? timetables.find(tt => tt.id === selectedTimetable)?.title ||
                  "Selectează orarul"
                : "-- Orar nou --"}
              <svg
                className="ms-3 h-2.5 w-2.5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 10 6"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 1 4 4 4-4"
                />
              </svg>
            </button>

            {showTimetableDropdown && (
              <div className="absolute top-full right-0 left-0 z-10 mt-1 w-full divide-y divide-gray-100 rounded-lg bg-white shadow-sm dark:bg-gray-700">
                <ul
                  className="py-2 text-sm text-gray-700 dark:text-gray-200"
                  aria-labelledby="dropdownDefaultButton"
                >
                  <li>
                    <button
                      onClick={() => {
                        setSelectedTimetable("");
                        setShowTimetableDropdown(false);
                      }}
                      className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                    >
                      -- Orar nou --
                    </button>
                  </li>

                  {timetables.filter(tt => tt.isOwner).length > 0 && (
                    <>
                      <li className="border-t border-gray-100 px-4 py-2 text-xs font-semibold text-gray-500 dark:border-gray-600 dark:text-gray-400">
                        Orarul meu (Owner)
                      </li>
                      {timetables
                        .filter(tt => tt.isOwner)
                        .map(tt => (
                          <li key={tt.id}>
                            <button
                              onClick={() => {
                                setSelectedTimetable(tt.id);
                                setShowTimetableDropdown(false);
                              }}
                              className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                            >
                              {tt.title} (Proprietar)
                            </button>
                          </li>
                        ))}
                    </>
                  )}

                  {timetables.filter(tt => !tt.isOwner && !tt.isTeacher)
                    .length > 0 && (
                    <>
                      <li className="border-t border-gray-100 px-4 py-2 text-xs font-semibold text-gray-500 dark:border-gray-600 dark:text-gray-400">
                        Orarul asignat
                      </li>
                      {timetables
                        .filter(tt => !tt.isOwner && !tt.isTeacher)
                        .map(tt => (
                          <li key={tt.id}>
                            <button
                              onClick={() => {
                                setSelectedTimetable(tt.id);
                                setShowTimetableDropdown(false);
                              }}
                              className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                            >
                              {tt.title} (Asignat de: {tt.owner})
                            </button>
                          </li>
                        ))}
                    </>
                  )}

                  {timetables.filter(tt => tt.isTeacher).length > 0 && (
                    <>
                      <li className="border-t border-gray-100 px-4 py-2 text-xs font-semibold text-gray-500 dark:border-gray-600 dark:text-gray-400">
                        Orarul unde sunt profesor
                      </li>
                      {timetables
                        .filter(tt => tt.isTeacher)
                        .map(tt => (
                          <li key={tt.id}>
                            <button
                              onClick={() => {
                                setSelectedTimetable(tt.id);
                                setShowTimetableDropdown(false);
                              }}
                              className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                            >
                              {tt.title} (Profesor - Proprietar: {tt.owner})
                            </button>
                          </li>
                        ))}
                    </>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {!storageAvailable && (
        <div className="mb-4 rounded border border-yellow-300 bg-yellow-100 p-3 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-300">
          Avertisment: Stocarea locală nu este disponibilă. Modificările
          dumneavoastră nu vor fi salvate între sesiuni.
        </div>
      )}

      <button
        onClick={handleCreateTimetable}
        className="rounded-lg border border-blue-500/10 bg-blue-300/30 px-6 py-3 text-lg font-medium text-blue-400 backdrop-blur-sm hover:bg-blue-300/70"
        disabled={loading}
      >
        {selectedTimetable
          ? timetables.find(tt => tt.id === selectedTimetable)?.isTeacher
            ? "Editează Disponibilitatea"
            : "Editează Orarul Selectat"
          : "Creează Orar Nou"}
      </button>

      {hasData && (
        <div className="mt-4 flex justify-center gap-4">
          <button
            onClick={onClearData}
            className="rounded-lg border border-red-500/10 bg-red-200 px-6 py-3 text-lg font-medium text-red-600 backdrop-blur-sm hover:bg-red-300"
          >
            Șterge Datele Salvate
          </button>

          <button
            onClick={onForceSave}
            className="rounded-lg border border-green-500/10 bg-green-200 px-6 py-3 text-lg font-medium text-green-700 backdrop-blur-sm hover:bg-green-300"
          >
            Forțează Salvarea Datelor
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
