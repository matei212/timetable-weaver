import { Class } from "../../util/timetable";
import ClassesTab from "../components/ClassesTab";

interface ClassesRouteProps {
  classes: Class[];
  onClassesChange: (classes: Class[]) => void;
}

const Classes: React.FC<ClassesRouteProps> = ({ classes, onClassesChange }) => {
  return <ClassesTab classes={classes} onClassesChange={onClassesChange} />;
};

export default Classes;
