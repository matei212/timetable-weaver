import { Class, Teacher } from "../../util/timetable";
import TeachersTab from "../components/TeachersTab";

interface TeachersRouteProps {
  teachers: Teacher[];
  classes: Class[];
  onTeachersChange: (teachers: Teacher[]) => void;
  onClassesChange: (classes: Class[]) => void;
}

const Teachers: React.FC<TeachersRouteProps> = ({
  teachers,
  classes,
  onTeachersChange,
  onClassesChange,
}) => {
  return (
    <TeachersTab
      teachers={teachers}
      classes={classes}
      onTeachersChange={onTeachersChange}
      onClassesChange={onClassesChange}
    />
  );
};

export default Teachers;
