import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { createTimetable, assignTimetableToTeachers } from "../services/firestoreUtils";

const Profile: React.FC = () => {
  const [user] = useAuthState(auth);
  const [judet, setJudet] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [role, setRole] = useState<string | null>(null);
  // Admin timetable creation state
  const [ttTitle, setTtTitle] = useState("");
  const [ttTeachers, setTtTeachers] = useState("");
  const [ttStatus, setTtStatus] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setJudet(docSnap.data().judet || "");
            setRole(docSnap.data().role || null);
          }
        } catch {
          setError("Failed to load profile");
        }
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    if (!user) return;
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { email: user.email || "", judet },
        { merge: true },
      );
      setSuccess("Profile updated!");
    } catch {
      setError("Failed to update profile");
    }
  };

  // Admin: handle timetable creation
  const handleCreateTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    setTtStatus("");
    if (!user) return;
    if (!ttTitle.trim()) {
      setTtStatus("Please enter a timetable title.");
      return;
    }
    const teacherEmails = ttTeachers.split(",").map(e => e.trim()).filter(Boolean);
    try {
      const timetableId = await createTimetable({
        ownerUid: user.uid,
        title: ttTitle,
        teachers: teacherEmails,
        classes: [],
        schedule: {},
      });
      await assignTimetableToTeachers(timetableId, teacherEmails);
      setTtStatus("Timetable created and teachers assigned!");
      setTtTitle("");
      setTtTeachers("");
    } catch (err) {
      setTtStatus("Failed to create timetable.");
    }
  };

  if (!user) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded bg-white p-8 text-center shadow">
        Please log in to view your profile.
      </div>
    );
  }

  return (
    <div className="mx-auto mt-16 flex max-w-md flex-col items-center rounded bg-white p-8 shadow">
      <h1 className="mb-6 text-2xl font-bold">Profilul meu</h1>
      <form className="flex w-full flex-col gap-4" onSubmit={handleSave}>
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            value={user.email || ""}
            disabled
            className="w-full rounded border bg-gray-100 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Județ</label>
          <select
            value={judet}
            onChange={e => setJudet(e.target.value)}
            className="mt-[2vh] block w-full text-sm font-medium text-white rounded-xl bg-gradient-to-r to-white from-black px-4 py-2"
          >{[
              "Alba",
              "Arad",
              "Argeș",
              "Bacău",
              "Bihor",
              "Bistrița-Năsăud",
              "Botoșani",
              "Brașov",
              "Brăila",
              "București",
              "Buzău",
              "Caraș-Severin",
              "Călărași",
              "Cluj",
              "Constanța",
              "Covasna",
              "Dâmbovița",
              "Dolj",
              "Galați",
              "Giurgiu",
              "Gorj",
              "Harghita",
              "Hunedoara",
              "Ialomița",
              "Iași",
              "Ilfov",
              "Maramureș",
              "Mehedinți",
              "Mureș",
              "Neamț",
              "Olt",
              "Prahova",
              "Satu Mare",
              "Sălaj",
              "Sibiu",
              "Suceava",
              "Teleorman",
              "Timiș",
              "Tulcea",
              "Vaslui",
              "Vâlcea",
              "Vrancea",
            ].map(j => (
              <option key={j} value={j} className="rounded bg-black text-white border border-red-600">
                {j}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="mt-2 rounded bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600"
        >
          Salvează
        </button>
        {success && (
          <div className="text-center text-sm text-green-600">{success}</div>
        )}
        {error && (
          <div className="text-center text-sm text-red-500">{error}</div>
        )}
      </form>
      {/* Admin timetable creation section */}
      {role === "ADMIN" && (
        <div className="mt-8 w-full border-t pt-6">
          <h2 className="mb-2 text-lg font-semibold">Creează un orar și adaugă profesori</h2>
          <form className="flex flex-col gap-2" onSubmit={handleCreateTimetable}>
            <input
              type="text"
              placeholder="Titlu orar (ex: 10A)"
              value={ttTitle}
              onChange={e => setTtTitle(e.target.value)}
              className="rounded border px-3 py-2"
            />
            <input
              type="text"
              placeholder="Emailuri profesori (separate prin virgulă)"
              value={ttTeachers}
              onChange={e => setTtTeachers(e.target.value)}
              className="rounded border px-3 py-2"
            />
            <button
              type="submit"
              className="rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
            >
              Creează orar
            </button>
            {ttStatus && <div className="text-center text-sm mt-2 text-blue-700">{ttStatus}</div>}
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
