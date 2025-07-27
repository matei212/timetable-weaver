import { Class, Teacher, Timetable } from "../../util/timetable";
import OverviewTab from "../components/OverviewTab";
import AdvancedSettingsProvider from "../providers/AdvancedSettings";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../services/firebase";
import { useEffect, useState } from "react";
import { isUserTimetableOwner } from "../services/firestoreUtils";

interface OverviewRouteProps {
  classes: Class[];
  teachers: Teacher[];
  onTimetableGenerated: (timetable: Timetable | null) => void;
  onTeachersChange: (teachers: Teacher[]) => void;
  onClassesChange: (classes: Class[] | ((prev: Class[]) => Class[])) => void;
  timetableId?: string;
  timetableName?: string;
}

const Overview: React.FC<OverviewRouteProps> = ({
  classes,
  teachers,
  onTimetableGenerated,
  onTeachersChange,
  onClassesChange,
  timetableId,
  timetableName,
}) => {
  const [user] = useAuthState(auth);
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOwnership = async () => {
      if (user && timetableId) {
        const ownerStatus = await isUserTimetableOwner(user.uid, timetableId);
        setIsOwner(ownerStatus);
      } else if (!timetableId) {
        // New timetable - user will be owner
        setIsOwner(true);
      } else {
        setIsOwner(false);
      }
      setLoading(false);
    };

    checkOwnership();
  }, [user, timetableId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4">Se verifică permisiunile...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4 text-xl font-bold">Acces interzis</h2>
          <p>Trebuie să vă autentificați pentru a accesa această pagină.</p>
        </div>
      </div>
    );
  }

  if (timetableId && !isOwner) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4 text-xl font-bold">Acces limitat</h2>
          <p>Nu aveți permisiuni de proprietar pentru acest orar.</p>
          <p className="text-sm text-gray-600 mt-2">
            Doar proprietarul orarului poate face modificări.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdvancedSettingsProvider>
      <OverviewTab
        classes={classes}
        teachers={teachers}
        onTimetableGenerated={onTimetableGenerated}
        onTeachersChange={onTeachersChange}
        onClassesChange={onClassesChange}
        timetableId={timetableId}
        timetableName={timetableName}
        isOwner={isOwner}
      />
    </AdvancedSettingsProvider>
  );
};

export default Overview;
