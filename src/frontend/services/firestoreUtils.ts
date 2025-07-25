import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  addDoc,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";

// Helper to create user collection with info document
export async function ensureUserCollection(user: {
  uid: string;
  email?: string;
  judet?: string;
}) {
  if (!user?.uid) return;
  const infoDocRef = doc(db, user.uid, "info");
  const infoDocSnap = await getDoc(infoDocRef);
  if (!infoDocSnap.exists()) {
    await setDoc(infoDocRef, {
      email: user.email || "",
      judet: user.judet || "",
      timetables: [],
    });
  }
}

// 1. Create user with role assignment
export async function createUserWithRole(
  uid: string,
  email: string,
): Promise<"ADMIN" | "TEACHER"> {
  const usersSnap = await getDocs(collection(db, "users"));
  const isFirstUser = usersSnap.empty;
  const role: "ADMIN" | "TEACHER" = isFirstUser ? "ADMIN" : "TEACHER";
  await setDoc(
    doc(db, "users", uid),
    {
      uid,
      email,
      role,
      assignedTimetables: [],
    },
    { merge: true },
  );
  return role;
}

// 2. Create timetable
export async function createTimetable({
  ownerUid,
  title,
  teachers,
  classes,
  schedule,
}: {
  ownerUid: string;
  title: string;
  teachers: string[];
  classes: unknown;
  schedule: unknown;
}): Promise<string> {
  const timetableDoc = await addDoc(collection(db, "timetables"), {
    owner: ownerUid,
    title,
    teachers,
    classes,
    schedule,
  });
  return timetableDoc.id;
}

// 3. Assign timetable to teachers
export async function assignTimetableToTeachers(
  timetableId: string,
  teacherEmails: string[],
): Promise<void> {
  for (const email of teacherEmails) {
    const usersSnap = await getDocs(collection(db, "users"));
    let userDoc: { id: string; data: () => DocumentData } | null = null;
    usersSnap.forEach(docSnap => {
      if (docSnap.data().email === email) {
        userDoc = { id: docSnap.id, data: docSnap.data };
      }
    });
    if (userDoc !== null) {
      const { id } = userDoc;
      await updateDoc(doc(db, "users", id), {
        assignedTimetables: arrayUnion(timetableId),
      });
    } else {
      const newUserRef = doc(collection(db, "users"));
      await setDoc(newUserRef, {
        uid: newUserRef.id,
        email,
        role: "TEACHER",
        assignedTimetables: [timetableId],
      });
    }
  }
}

// 4. Save teacher availability
export async function saveTeacherAvailability(
  timetableId: string,
  teacherUid: string,
  availability: object,
): Promise<void> {
  await setDoc(
    doc(db, "timetables", timetableId, "availability", teacherUid),
    availability,
    { merge: true },
  );
}
