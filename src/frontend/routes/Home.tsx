import { useNavigate } from "react-router-dom";
import ThemeButton from "../components/common/ThemeButton";
import { useEffect, useState } from "react";
import { fetchAllTimetables } from "../services/firestoreUtils";

interface Timetable {
  id: string;
  title: string;
  owner: string;
}

interface HomeProps {
  storageAvailable: boolean;
  hasData: boolean;
  onClearData: () => void;
  onForceSave: () => void;
  onCreateTimetable: (timetableId?: string) => void;
}

const Home: React.FC<HomeProps> = ({
  storageAvailable,
  hasData,
  onClearData,
  onForceSave,
  onCreateTimetable,
}) => {
  const navigate = useNavigate();
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllTimetables().then((data) => {
      setTimetables(
        (data as Array<{ id: string; title?: string; owner?: string }>).map(tt => ({
          id: tt.id,
          title: tt.title || "(fără titlu)",
          owner: tt.owner || "necunoscut",
        }))
      );
      setLoading(false);
    });
  }, []);

  const handleCreateTimetable = () => {
    onCreateTimetable(selectedTimetable);
    navigate("/overview");
  };

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
      <p className="mb-8 text-gray-700">
        Creați orare optime pentru școala sau instituția dumneavoastră cu
        sistemul nostru inteligent de programare.
      </p>

      {loading ? (
        <div className="mb-4">Se încarcă orarele existente...</div>
      ) : (
        <div className="mb-4">
          <label className="block mb-2 font-medium">Selectează orarul de editat:</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={selectedTimetable}
            onChange={e => setSelectedTimetable(e.target.value)}
          >
            <option value="">-- Orar nou --</option>
            {timetables.map(tt => (
              <option key={tt.id} value={tt.id}>
                {tt.title || tt.id} (creat de: {tt.owner})
              </option>
            ))}
          </select>
        </div>
      )}

      {!storageAvailable && (
        <div className="mb-4 rounded border border-yellow-300 bg-yellow-100 p-3 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-300">
          Avertisment: Stocarea locală nu este disponibilă. Modificările
          dumneavoastră nu vor fi salvate între sesiuni.
        </div>
      )}

      <button
        //variant="blue"
        onClick={handleCreateTimetable}
        className="rounded-lg border border-blue-500/10 bg-blue-300/30 px-6 py-3 text-lg font-medium text-blue-400 backdrop-blur-sm"
        disabled={loading}
      >
        {selectedTimetable ? "Editează Orarul Selectat" : "Creează Orar Nou"}
      </button>

      {hasData && (
        <div className="mt-4 flex justify-center gap-4">
          <button
            onClick={onClearData}
            //variant="red"
            className="rounded-lg border border-red-500/10 bg-red-200 px-6 py-3 text-lg font-medium text-red-600 backdrop-blur-sm"
          >
            Șterge Datele Salvate
          </button>

          <button
            onClick={onForceSave}
            className="rounded-lg border border-green-500/10 bg-green-200 px-6 py-3 text-lg font-medium text-green-700 backdrop-blur-sm"
          >
            Forțează Salvarea Datelor
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
