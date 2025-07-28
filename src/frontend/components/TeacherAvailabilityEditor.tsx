import React, { useState, useEffect } from "react";
import {
  Availability,
  DAYS,
  PERIODS_PER_DAY,
  Teacher,
} from "../../util/timetable";
import GradientContainer from "./common/GradientContainer";
import GradientButton from "./common/GradientButton";
import ColorButton from "./common/ColorButton";
import Background from "./common/Background";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../services/firebase";
import { fetchTeachersForTimetable } from "../services/firestoreUtils";

const dayNames = ["Luni", "Marți", "Miercuri", "Joi", "Vineri"];

interface TeacherAvailabilityEditorProps {
  timetableId: string;
  onClose: () => void;
}

const TeacherAvailabilityEditor: React.FC<TeacherAvailabilityEditorProps> = ({
  timetableId,
  onClose,
}) => {
  const [user] = useAuthState(auth);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [editAvailability, setEditAvailability] = useState<Availability>(
    new Availability(DAYS, PERIODS_PER_DAY),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const findTeacherByEmail = async () => {
      if (!user?.email) return;
      
      try {
        const teachersData = await fetchTeachersForTimetable(timetableId);
        const teacherData = teachersData.find(t => t.email === user.email);
        
        if (teacherData) {
          const availability = new Availability(DAYS, PERIODS_PER_DAY);
          if (teacherData.availability) {
            const availabilityData = teacherData.availability as { [key: string]: unknown };
            if (availabilityData.buffer && typeof availabilityData.buffer === "object") {
              const bufferValues = Object.values(availabilityData.buffer as { [key: string]: number });
              if (bufferValues.length > 0) {
                availability.buffer = bufferValues;
              }
            }
          }
          
          const foundTeacher = new Teacher(teacherData.name, availability, teacherData.email);
          foundTeacher.id = teacherData.name;
          setTeacher(foundTeacher);
          setEditAvailability(availability);
        }
      } catch (error) {
        console.error("Error finding teacher:", error);
      } finally {
        setLoading(false);
      }
    };

    findTeacherByEmail();
  }, [user, timetableId]);

  const handleCellClick = (day: number, period: number) => {
    const newAvail = new Availability(DAYS, PERIODS_PER_DAY);
    newAvail.buffer = [...editAvailability.buffer];
    newAvail.toggle(day, period);
    setEditAvailability(newAvail);
  };

  const handleSave = async () => {
    if (!teacher) return;
    
    setSaving(true);
    try {
      teacher.availability = editAvailability;
      
      const { updateTimetableTeachers } = await import("../services/firestoreUtils");
      await updateTimetableTeachers(timetableId, [teacher]);
      
      alert("Disponibilitatea a fost salvată cu succes!");
      onClose();
    } catch (error) {
      console.error("Error saving availability:", error);
      alert("Eroare la salvarea disponibilității!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <Background />
        <div className="text-center">
          <div className="mb-4 text-xl">Se încarcă...</div>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <Background />
        <div className="text-center">
          <div className="mb-4 text-xl">Nu ați fost găsit ca profesor în acest orar.</div>
          <ColorButton variant="gray" onClick={onClose}>
            Închide
          </ColorButton>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <Background />
      <div className="flex h-full w-full flex-col">
        <GradientContainer
          variant="light"
          className="flex h-full flex-col p-7 shadow-2xl shadow-blue-500/20"
        >
          <div className="flex-1 overflow-y-auto">
            <h2 className="mb-5 text-2xl font-bold">
              Editează Disponibilitatea:{" "}
              <span className="text-gradient-blue">{teacher.name}</span>
            </h2>
            <p className="mb-4 text-gray-600">
              Click pe o celulă pentru a schimba disponibilitatea (✓ = Disponibil, ✗ = Indisponibil)
            </p>
            
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
                        {p + 8}:00 - {p + 8}:50
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
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <ColorButton
              variant="gray"
              onClick={onClose}
              className="px-5 py-2.5"
            >
              Anulează
            </ColorButton>
            <GradientButton 
              onClick={handleSave} 
              className="px-5 py-2.5"
              disabled={saving}
            >
              {saving ? "Se salvează..." : "Salvează"}
            </GradientButton>
          </div>
        </GradientContainer>
      </div>
    </div>
  );
};

export default TeacherAvailabilityEditor; 