import { Link } from "react-router-dom";

const NotFound: React.FC = () => {
  return (
    <div className="mx-auto max-w-2xl p-6 text-center">
      <h2 className="mb-4 text-2xl font-bold text-red-600 dark:text-red-400">
        404 - Pagină Negăsită
      </h2>
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        Pagina pe care o căutați nu există sau a fost mutată.
      </p>
      <Link
        to="/"
        className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
      >
        Înapoi la Pagina Principală
      </Link>
    </div>
  );
};

export default NotFound;
