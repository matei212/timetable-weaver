import React, { useState } from "react";
import {
  Availability,
  DAYS,
  PERIODS_PER_DAY,
  Teacher,
} from "../../util/timetable";
import GradientContainer from "./common/GradientContainer";
import GradientButton from "./common/GradientButton";
import ColorButton from "./common/ColorButton";

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
    new Availability(DAYS, PERIODS_PER_DAY),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <GradientContainer
        variant="light"
        className="max-w-4xl p-6 shadow-2xl shadow-blue-500/20"
      >
        <h2 className="mb-5 text-xl font-bold">
          Editează Disponibilitatea Profesorului:{" "}
          <span className="text-gradient-blue">{teacher.name}</span>
        </h2>
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="bg-slate-200 dark:bg-slate-700/50 dark:text-slate-200">
                <th className="border-slate-600/50 p-3 font-medium tracking-wide"></th>
                {dayNames.map((day, d) => (
                  <th
                    key={d}
                    className="border-slate-600/50 p-3 font-medium tracking-wide"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: PERIODS_PER_DAY }, (_, p) => (
                <tr
                  key={p}
                  className="transition-colors duration-200 hover:bg-slate-700/50"
                >
                  <th className="p-3 text-left font-medium dark:text-zinc-300">
                    Perioada {p + 1}
                  </th>
                  {Array.from({ length: DAYS }, (_, d) => {
                    const available = editAvailability.get(d, p);
                    return (
                      <td
                        key={d}
                        className={`cursor-pointer p-3 text-center text-white select-none ${
                          available
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "bg-red-600 hover:bg-red-700"
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
        <div className="mt-6 flex justify-end gap-3">
          <ColorButton variant="gray" onClick={onClose} className="px-5 py-2.5">
            Anulează
          </ColorButton>
          <GradientButton onClick={handleSave} className="px-5 py-2.5">
            Salvează
          </GradientButton>
        </div>
      </GradientContainer>
    </div>
  );
};

export default TeacherAvailabilityModal;
