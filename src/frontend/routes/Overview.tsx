import { Class, Teacher, Timetable } from "../../util/timetable";
import OverviewTab from "../components/OverviewTab";

interface OverviewRouteProps {
  classes: Class[];
  teachers: Teacher[];
  onTimetableGenerated: (timetable: Timetable | null) => void;
  onTeachersChange: (teachers: Teacher[]) => void;
  onClassesChange: (classes: Class[]) => void;
}

const Overview: React.FC<OverviewRouteProps> = ({
  classes,
  teachers,
  onTimetableGenerated,
  onTeachersChange,
  onClassesChange,
}) => {
  return (
    <OverviewTab
      classes={classes}
      teachers={teachers}
      onTimetableGenerated={onTimetableGenerated}
      onTeachersChange={onTeachersChange}
      onClassesChange={onClassesChange}
    />
  );
};

export default Overview;
