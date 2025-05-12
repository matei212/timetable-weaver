import { Class, Teacher } from "../../util/timetable";
import LessonsTab from "../components/LessonsTab";

interface LessonsRouteProps {
  classes: Class[];
  teachers: Teacher[];
  onClassesChange: (classes: Class[]) => void;
}

const Lessons: React.FC<LessonsRouteProps> = ({
  classes,
  teachers,
  onClassesChange,
}) => {
  return (
    <LessonsTab
      classes={classes}
      teachers={teachers}
      onClassesChange={onClassesChange}
    />
  );
};

export default Lessons;
