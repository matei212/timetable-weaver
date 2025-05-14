import { useNavigate } from "react-router-dom";

interface HomeProps {
  storageAvailable: boolean;
  hasData: boolean;
  onClearData: () => void;
  onForceSave: () => void;
  onCreateTimetable: () => void;
}

const Home: React.FC<HomeProps> = ({
  storageAvailable,
  hasData,
  onClearData,
  onForceSave,
  onCreateTimetable,
}) => {
  const navigate = useNavigate();

  const handleCreateTimetable = () => {
    onCreateTimetable();
    navigate("/overview");
  };

  return (
    <div className="mx-auto max-w-2xl p-6 text-center">
      <img src="./vite.svg" className="logo mx-auto mb-8" alt="Logo Vite" />
      <h1 className="mb-6 text-3xl font-bold dark:text-white">
        Bine ați venit la Timetable Weaver 
      </h1>
      <p className="mb-8 text-gray-400">
        Creați orare optime pentru școala sau instituția dumneavoastră cu sistemul nostru 
        inteligent de programare.
      </p>

      {!storageAvailable && (
        <div className="mb-4 rounded border border-yellow-300 bg-yellow-100 p-3 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-300">
          Avertisment: Stocarea locală nu este disponibilă. Modificările dumneavoastră nu vor fi salvate
          între sesiuni.
        </div>
      )}

      <button
        onClick={handleCreateTimetable}
        className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-lg font-medium
                        transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/30 transform hover:-translate-y-0.5
                        hover:from-blue-700 hover:to-blue-800 backdrop-blur-sm"
      >
        Creează Orar Nou
      </button>

      {hasData && (
        <div className="mt-4 flex justify-center gap-4">
          <button
            onClick={onClearData}
            className="rounded-lg bg-gradient-to-r from-red-600 to-pink-600 px-6 py-3 text-lg font-medium
                        transition-all duration-300 hover:shadow-lg hover:shadow-red-500/30 transform hover:-translate-y-0.5
                        hover:from-red-700 hover:to-pink-700 backdrop-blur-sm"
          >
            Șterge Datele Salvate
          </button>
          <button
            onClick={onForceSave}
            className="rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 text-lg font-medium
                        transition-all duration-300 hover:shadow-lg hover:shadow-green-900/30 transform hover:-translate-y-0.5
                        hover:from-green-700 hover:to-green-800 backdrop-blur-sm"
          >
            Forțează Salvarea Datelor
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
