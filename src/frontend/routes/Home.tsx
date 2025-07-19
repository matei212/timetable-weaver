import { useNavigate } from "react-router-dom";
import GradientButton from "../components/common/GradientButton";

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
      <p className="mb-8 text-gray-700">
        Creați orare optime pentru școala sau instituția dumneavoastră cu
        sistemul nostru inteligent de programare.
      </p>

      {!storageAvailable && (
        <div className="mb-4 rounded border border-yellow-300 bg-yellow-100 p-3 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-300">
          Avertisment: Stocarea locală nu este disponibilă. Modificările
          dumneavoastră nu vor fi salvate între sesiuni.
        </div>
      )}

      <GradientButton
        variant="blue"
        onClick={handleCreateTimetable}
        className="px-6 py-3 text-lg font-medium"
      >
        Creează Orar Nou
      </GradientButton>

      {hasData && (
        <div className="mt-4 flex justify-center gap-4">
          <GradientButton
            onClick={onClearData}
            variant="red"
            className="px-6 py-3 text-lg font-medium"
          >
            Șterge Datele Salvate
          </GradientButton>

          <GradientButton
            onClick={onForceSave}
            className="px-6 py-3 text-lg font-medium"
          >
            Forțează Salvarea Datelor
          </GradientButton>
        </div>
      )}
    </div>
  );
};

export default Home;
