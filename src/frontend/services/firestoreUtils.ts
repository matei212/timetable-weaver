import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  addDoc,
  deleteDoc,
  DocumentData,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { Teacher } from "../../util/timetable";

export type FetchedLesson = {
    type: "normal" | "alternating" | "group";
    name?: string;
    names?: [string, string];
    teacher?: string;
    teachers?: string[];
    periodsPerWeek: number;
  };

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
): Promise<"ADMIN" | "TEACHER" | "OWNER"> {
  const usersSnap = await getDocs(collection(db, "users"));
  const isFirstUser = usersSnap.empty;
  
  let role: "ADMIN" | "TEACHER" | "OWNER" = "ADMIN";
  
  if (!isFirstUser) {
    try {
      const allTimetables = await fetchAllTimetables();
      let isTeacherInAnyTimetable = false;
      
      for (const timetable of allTimetables) {
        try {
          const teachersData = await fetchTeachersForTimetable(timetable.id);
          const teacherData = teachersData.find(t => t.email === email);
          if (teacherData) {
            isTeacherInAnyTimetable = true;
            break;
          }
        } catch (error) {
          console.error(`Error checking teachers in timetable ${timetable.id}:`, error);
        }
      }
      
      if (isTeacherInAnyTimetable) {
        role = "TEACHER";
      }
    } catch (error) {
      console.error("Error checking if user is teacher:", error);
    }
  }
  
  await setDoc(
    doc(db, "users", uid),
    {
      uid,
      email,
      role,
      assignedTimetables: [],
      ownedTimetables: [],
    },
    { merge: true },
  );
  return role;
}

// 2. Create timetable
export async function createTimetable({
  ownerUid,
  title,
  classes,
  schedule,
}: {
  ownerUid: string;
  title: string;
  classes: unknown;
  schedule: unknown;
}): Promise<string> {
  const timetableDoc = await addDoc(collection(db, "timetables"), {
    owner: ownerUid,
    title,
    classes,
    schedule,
    createdAt: new Date(),
  });
  
  // Update owner's ownedTimetables array
  await updateDoc(doc(db, "users", ownerUid), {
    ownedTimetables: arrayUnion(timetableDoc.id),
  });
  
  return timetableDoc.id;
}

// Check if user is owner of a timetable
export async function isUserTimetableOwner(
  userId: string,
  timetableId: string,
): Promise<boolean> {
  try {
    const timetableDoc = await getDoc(doc(db, "timetables", timetableId));
    if (timetableDoc.exists()) {
      return timetableDoc.data().owner === userId;
    }
    return false;
  } catch (error) {
    console.error("Error checking timetable ownership:", error);
    return false;
  }
}

// Get user's owned timetables
export async function getUserOwnedTimetables(userId: string): Promise<string[]> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data().ownedTimetables || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching user's owned timetables:", error);
    return [];
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

// Fetch timetables for a specific user (owned and assigned)
export async function fetchUserTimetables(userId: string, userEmail?: string) {
  const userDoc = await getDoc(doc(db, "users", userId));
  if (!userDoc.exists()) {
    return { owned: [], assigned: [], teacherIn: [] };
  }
  
  const userData = userDoc.data();
  const ownedTimetables = userData.ownedTimetables || [];
  const assignedTimetables = userData.assignedTimetables || [];
  
  // Fetch details for owned timetables
  const ownedDetails = await Promise.all(
    ownedTimetables.map(async (timetableId: string) => {
      const timetableDoc = await getDoc(doc(db, "timetables", timetableId));
      if (timetableDoc.exists()) {
        return {
          id: timetableId,
          ...timetableDoc.data(),
          isOwner: true,
        };
      }
      return null;
    })
  );
  
  // Fetch details for assigned timetables
  const assignedDetails = await Promise.all(
    assignedTimetables.map(async (timetableId: string) => {
      const timetableDoc = await getDoc(doc(db, "timetables", timetableId));
      if (timetableDoc.exists()) {
        return {
          id: timetableId,
          ...timetableDoc.data(),
          isOwner: false,
        };
      }
      return null;
    })
  );

  const teacherInTimetables: Array<{
    id: string;
    title?: string;
    owner?: string;
    createdAt?: Date;
    isOwner: boolean;
    isTeacher: boolean;
  }> = [];
  if (userEmail) {
    try {
      const allTimetables = await fetchAllTimetables();
      
      for (const timetable of allTimetables) {
        try {
          const teachersData = await fetchTeachersForTimetable(timetable.id);
          const teacherData = teachersData.find(t => t.email === userEmail);
          if (teacherData) {
            teacherInTimetables.push({
              ...timetable,
              isOwner: false,
              isTeacher: true,
            });
          }
        } catch (error) {
          console.error(`Error checking teachers in timetable ${timetable.id}:`, error);
        }
      }
    } catch (error) {
      console.error("Error fetching timetables for teacher check:", error);
    }
  }
  
  return {
    owned: ownedDetails.filter(t => t !== null),
    assigned: assignedDetails.filter(t => t !== null),
    teacherIn: teacherInTimetables,
  };
}

// 7. Update teachers and their availability for a specific timetable
export const updateTimetableTeachers = async (timetableId: string, teachers: Teacher[]) => {
  const batch = writeBatch(db);

  teachers.forEach(teacher => {
    const teacherDocRef = doc(db, `timetables/${timetableId}/allteachers`, teacher.name);
    // Convert the Teacher class instance to a plain object for Firestore
    const teacherObject = {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email || null, // Add email field
      // Manually convert availability to a plain object
      availability: {
        buffer: { ...teacher.availability.buffer }
      }
    };
    batch.set(teacherDocRef, teacherObject, { merge: true }); // Use merge to update existing documents
  });

  await batch.commit();
};

// 8. Update classes for a specific timetable
export async function updateTimetableClasses(
  timetableId: string,
  classes: Array<{ name: string }>
): Promise<void> {
  // Update the classes field in the timetable document
  await updateDoc(doc(db, "timetables", timetableId), {
    classes: classes.map(c => c.name),
  });
  
  // Get existing classes from database
  const classesCollection = collection(db, "timetables", timetableId, "allgrades");
  const existingClasses = await getDocs(classesCollection);
  
  // Create a set of current class names for easy lookup
  const currentClassNames = new Set(classes.map(c => c.name));
  
  // Delete classes that no longer exist
  for (const classDoc of existingClasses.docs) {
    if (!currentClassNames.has(classDoc.id)) {
      await deleteDoc(doc(classesCollection, classDoc.id));
    }
  }
  
  // Save each current class in a subcollection (complete overwrite)
  for (const classItem of classes) {
    // Use setDoc without merge option to completely overwrite existing data
    await setDoc(doc(classesCollection, classItem.name), {
      name: classItem.name,
    });
  }
}

// 9. Update lessons for a specific timetable
export async function updateTimetableLessons(
  timetableId: string,
  classes: Array<{ name: string; lessons: Array<{
    type: "normal" | "alternating" | "group";
    name?: string;
    names?: [string, string];
    teacher?: { name: string };
    teachers?: [{ name: string }, { name: string }];
    periodsPerWeek: number;
  }> }>
): Promise<void> {
  // Get existing lessons from database
  const lessonsCollection = collection(db, "timetables", timetableId, "alllessons");
  const existingLessons = await getDocs(lessonsCollection);
  
  // Create a set of current class names for easy lookup
  const currentClassNames = new Set(classes.map(c => c.name));
  
  // Delete lessons for classes that no longer exist
  for (const lessonDoc of existingLessons.docs) {
    if (!currentClassNames.has(lessonDoc.id)) {
      await deleteDoc(doc(lessonsCollection, lessonDoc.id));
    }
  }
  
  // Save lessons for each current class in a subcollection
  for (const classItem of classes) {
    const classLessons = classItem.lessons.map((lesson, index) => {
      const lessonData: {
        type: "normal" | "alternating" | "group";
        periodsPerWeek: number;
        class: string;
        lessonIndex: number;
        name?: string;
        names?: [string, string];
        teacher?: string;
        teachers?: string[];
      } = {
        type: lesson.type,
        periodsPerWeek: lesson.periodsPerWeek,
        class: classItem.name,
        lessonIndex: index
      };

      // Handle different lesson types
      if (lesson.type === "normal") {
        lessonData.name = lesson.name;
        lessonData.teacher = lesson.teacher?.name;
      } else if (lesson.type === "alternating") {
        lessonData.names = lesson.names;
        lessonData.teachers = lesson.teachers?.map(t => t.name);
      } else if (lesson.type === "group") {
        lessonData.name = lesson.name;
        lessonData.teachers = lesson.teachers?.map(t => t.name);
      }

      return lessonData;
    });

    // Save all lessons for this class
    await setDoc(doc(lessonsCollection, classItem.name), {
      className: classItem.name,
      lessons: classLessons
    });
  }
}

// 7. Fetch all teachers for a specific timetable
export async function fetchTeachersForTimetable(
  timetableId: string,
): Promise<DocumentData[]> {
  const teachersCollection = collection(
    db,
    "timetables",
    timetableId,
    "allteachers",
  );
  const snapshot = await getDocs(teachersCollection);
  return snapshot.docs.map(doc => doc.data());
}

// 8. Fetch all grades for a specific timetable
export async function fetchGradesForTimetable(
  timetableId: string,
): Promise<DocumentData[]> {
  const gradesCollection = collection(
    db,
    "timetables",
    timetableId,
    "allgrades",
  );
  const snapshot = await getDocs(gradesCollection);
  return snapshot.docs.map(doc => doc.data());
}

// 9. Fetch all lessons for a specific timetable
export async function fetchLessonsForTimetable(
  timetableId: string,
): Promise<DocumentData[]> {
  const lessonsCollection = collection(
    db,
    "timetables",
    timetableId,
    "alllessons",
  );
  const snapshot = await getDocs(lessonsCollection);
  return snapshot.docs.map(doc => doc.data());
}
