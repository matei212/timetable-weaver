import { FC } from "react";
import OverviewTab from "../components/OverviewTab";
import { Class, Teacher, Timetable } from "../../util/timetable";

interface OverviewProps {
  classes: Class[];
  teachers: Teacher[];
  onTimetableGenerated: (timetable: Timetable | null) => void;
  onTeachersChange: (teachers: Teacher[]) => void;
  onClassesChange: (classes: Class[]) => void;
}

const Overview: FC<OverviewProps> = ({
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