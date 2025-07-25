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

// 5. Save all teachers and their availability in a human-readable way
export async function saveAllTeachersForUser(
  userUid: string,
  teachers: Array<{ id: string; name: string; availability: { buffer?: number[] } | object }>
): Promise<void> {
  const teachersCollection = collection(db, "users", userUid, "teachers");
  for (const teacher of teachers) {
    // Convert availability to a readable object if needed
    let readableAvailability: { [key: string]: number } | object = teacher.availability;
    if (
      typeof teacher.availability === "object" &&
      teacher.availability !== null &&
      "buffer" in teacher.availability &&
      Array.isArray((teacher.availability as { buffer: number[] }).buffer)
    ) {
      const buffer = (teacher.availability as { buffer: number[] }).buffer;
      readableAvailability = {};
      for (let day = 0; day < buffer.length; day++) {
        (readableAvailability as { [key: string]: number })[`day_${day}`] = buffer[day];
      }
    }
    await setDoc(doc(teachersCollection, teacher.id), {
      id: teacher.id,
      name: teacher.name,
      availability: readableAvailability,
    });
  }
}

// 6. Fetch all timetables (id, title, ownerUid)
export async function fetchAllTimetables() {
  const snapshot = await getDocs(collection(db, "timetables"));
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

// 7. Update teachers and their availability for a specific timetable
export async function updateTimetableTeachers(
  timetableId: string,
  teachers: Array<{ id: string; name: string; availability: { buffer?: number[] } | object }>
): Promise<void> {
  // Update the teachers field in the timetable document
  await updateDoc(doc(db, "timetables", timetableId), {
    teachers: teachers.map(t => t.name),
  });
  
  // Save each teacher's availability in a subcollection (complete overwrite)
  const teachersCollection = collection(db, "timetables", timetableId, "allteachers");
  for (const teacher of teachers) {
    let readableAvailability: { [key: string]: number } | object = teacher.availability;
    if (
      typeof teacher.availability === "object" &&
      teacher.availability !== null &&
      "buffer" in teacher.availability &&
      Array.isArray((teacher.availability as { buffer: number[] }).buffer)
    ) {
      const buffer = (teacher.availability as { buffer: number[] }).buffer;
      readableAvailability = {};
      for (let day = 0; day < buffer.length; day++) {
        (readableAvailability as { [key: string]: number })[`day_${day}`] = buffer[day];
      }
    }
    
    // Use setDoc without merge option to completely overwrite existing data
    await setDoc(doc(teachersCollection, teacher.id), {
      id: teacher.id,
      name: teacher.name,
      availability: readableAvailability,
    });
  }
}

// 8. Update classes for a specific timetable
export async function updateTimetableClasses(
  timetableId: string,
  classes: Array<{ name: string }>
): Promise<void> {
  // Update the classes field in the timetable document
  await updateDoc(doc(db, "timetables", timetableId), {
    classes: classes.map(c => c.name),
  });
  
  // Save each class in a subcollection (complete overwrite)
  const classesCollection = collection(db, "timetables", timetableId, "allgrades");
  for (const classItem of classes) {
    // Use setDoc without merge option to completely overwrite existing data
    await setDoc(doc(classesCollection, classItem.name), {
      name: classItem.name,
    });
  }
}
