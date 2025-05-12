import React, { useState } from "react";
import { Availability, DAYS, PERIODS_PER_DAY, Teacher } from "../../util/timetable";

interface TeacherAvailabilityModalProps {
  teacher: Teacher;
  onClose: () => void;
  onSave: (newAvailability: Availability) => void;
}

const dayNames = ["Luni", "Marți", "Miercuri", "Joi", "Vineri"];

const TeacherAvailabilityModal: React.FC<TeacherAvailabilityModalProps> = ({
  teacher,
  onClose,
  onSave,
}) => {
  // Clone the availability for editing
  const [editAvailability, setEditAvailability] = useState<Availability>(
    new Availability(DAYS, PERIODS_PER_DAY)
  );

  React.useEffect(() => {
    // Deep copy the passed availability
    const copy = new Availability(DAYS, PERIODS_PER_DAY);
    copy.buffer = [...teacher.availability.buffer];
    setEditAvailability(copy);
  }, [teacher]);

  const handleCellClick = (day: number, period: number) => {
    const newAvail = new Availability(DAYS, PERIODS_PER_DAY);
    newAvail.buffer = [...editAvailability.buffer];
    newAvail.toggle(day, period);
    setEditAvailability(newAvail);
  };

  const handleSave = () => {
    onSave(editAvailability);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-zinc-900 rounded-xl shadow-2xl shadow-blue-500/20 p-6 min-w-[650px] max-w-4xl border border-zinc-700/50 animate-fadeIn">
        <h2 className="text-xl font-bold mb-5 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Editează Disponibilitatea Profesorului: <span className="text-blue-300">{teacher.name}</span>
        </h2>
        <div className="overflow-x-auto rounded-lg shadow-inner shadow-blue-500/10 bg-zinc-800/50 p-2">
          <table className="border-collapse w-full">
            <thead>
              <tr className="bg-gradient-to-r from-zinc-800 to-zinc-900">
                <th className="p-3 border-b border-zinc-700/50"></th>
                {dayNames.map((day, d) => (
                  <th key={d} className="p-3 border-b border-zinc-700/50 text-center font-medium text-zinc-300">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: PERIODS_PER_DAY }, (_, p) => (
                <tr key={p} className="hover:bg-zinc-800/70 transition-colors duration-200">
                  <th className="p-3 border-r border-zinc-700/50 text-left font-medium text-zinc-300">Perioada {p + 1}</th>
                  {Array.from({ length: DAYS }, (_, d) => {
                    const available = editAvailability.get(d, p);
                    return (
                      <td
                        key={d}
                        className={`p-3 border-r border-b border-zinc-700/30 text-center cursor-pointer select-none transition-all duration-300 ${
                          available 
                            ? "bg-gradient-to-r from-emerald-500/80 to-green-600/80 hover:from-emerald-600/90 hover:to-green-700/90" 
                            : "bg-gradient-to-r from-red-500/80 to-rose-600/80 hover:from-red-600/90 hover:to-rose-700/90"
                        }`}
                        onClick={() => handleCellClick(d, p)}
                        title={available ? "Disponibil" : "Indisponibil"}
                      >
                        {available ? "✓" : "✗"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            className="px-5 py-2.5 bg-gradient-to-r from-zinc-600 to-zinc-700 hover:from-zinc-700 hover:to-zinc-800 text-white rounded-md transition-all duration-300 hover:shadow-md"
            onClick={onClose}
          >
            Anulează
          </button>
          <button
            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-md transition-all duration-300 hover:shadow-md hover:shadow-blue-500/30 transform hover:-translate-y-0.5"
            onClick={handleSave}
          >
            Salvează
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherAvailabilityModal; 