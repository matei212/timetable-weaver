import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { createTimetable } from "../services/firestoreUtils";

const Profile: React.FC = () => {
  const [user] = useAuthState(auth);
  const [judet, setJudet] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [role, setRole] = useState<string | null>(null);
  // Admin timetable creation state
  const [ttTitle, setTtTitle] = useState("");
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
    try {
      await createTimetable({
        ownerUid: user.uid,
        title: ttTitle,
        classes: [],
        schedule: {},
      });
      setTtStatus("Timetable created successfully!");
      setTtTitle("");
    } catch {
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
          >
            <option value="">Selectează județul</option>
            <option value="Alba">Alba</option>
            <option value="Arad">Arad</option>
            <option value="Argeș">Argeș</option>
            <option value="Bacău">Bacău</option>
            <option value="Bihor">Bihor</option>
            <option value="Bistrița-Năsăud">Bistrița-Năsăud</option>
            <option value="Botoșani">Botoșani</option>
            <option value="Brăila">Brăila</option>
            <option value="Brașov">Brașov</option>
            <option value="București">București</option>
            <option value="Buzău">Buzău</option>
            <option value="Călărași">Călărași</option>
            <option value="Caraș-Severin">Caraș-Severin</option>
            <option value="Cluj">Cluj</option>
            <option value="Constanța">Constanța</option>
            <option value="Covasna">Covasna</option>
            <option value="Dâmbovița">Dâmbovița</option>
            <option value="Dolj">Dolj</option>
            <option value="Galați">Galați</option>
            <option value="Giurgiu">Giurgiu</option>
            <option value="Gorj">Gorj</option>
            <option value="Harghita">Harghita</option>
            <option value="Hunedoara">Hunedoara</option>
            <option value="Ialomița">Ialomița</option>
            <option value="Iași">Iași</option>
            <option value="Ilfov">Ilfov</option>
            <option value="Maramureș">Maramureș</option>
            <option value="Mehedinți">Mehedinți</option>
            <option value="Mureș">Mureș</option>
            <option value="Neamț">Neamț</option>
            <option value="Olt">Olt</option>
            <option value="Prahova">Prahova</option>
            <option value="Sălaj">Sălaj</option>
            <option value="Satu Mare">Satu Mare</option>
            <option value="Sibiu">Sibiu</option>
            <option value="Suceava">Suceava</option>
            <option value="Teleorman">Teleorman</option>
            <option value="Timiș">Timiș</option>
            <option value="Tulcea">Tulcea</option>
            <option value="Vâlcea">Vâlcea</option>
            <option value="Vaslui">Vaslui</option>
            <option value="Vrancea">Vrancea</option>
          </select>
        </div>
        <button
          type="submit"
          className="mt-2 rounded bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600"
        >
          Save Profile
        </button>
        {error && (
          <div className="text-center text-sm text-red-500">{error}</div>
        )}
        {success && (
          <div className="text-center text-sm text-green-600">{success}</div>
        )}
      </form>

      {role === "ADMIN" && (
        <div className="mt-8 w-full border-t pt-6">
          <h2 className="mb-2 text-lg font-semibold">Creează un orar nou</h2>
          <form className="flex flex-col gap-2" onSubmit={handleCreateTimetable}>
            <input
              type="text"
              placeholder="Titlu orar (ex: 10A)"
              value={ttTitle}
              onChange={e => setTtTitle(e.target.value)}
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
