import { PropsWithChildren, useMemo } from "react";

type Props = {
  variant?: "blue" | "indigo" | "red" | "green";
  onClick?: () => void;
  className?: string;
} & PropsWithChildren;

const ColorButton = ({ variant, onClick, className, children }: Props) => {
  const backgroundClasses = useMemo(() => {
    switch (variant) {
      case "blue":
        return "bg-blue-200 text-blue-500 hover:bg-blue-300/80 dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/30 dark:hover:text-blue-200";
      case "indigo":
        return "bg-indigo-600/20 text-indigo-500 hover:bg-indigo-600/30 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/30 dark:hover:text-indigo-200";
      case "red":
        return "bg-red-500/20 text-red-500 hover:bg-red-500/30 dark:text-red-300 dark:hover:bg-red-500/30 dark:hover:text-red-200";
      case "green":
      default:
        return "bg-teal-500/20 text-teal-500 hover:bg-teal-500/30 hover:text-teal-300";
    }
  }, [variant]);

  return (
    <button
      onClick={onClick}
      className={`rounded-lg transition-all duration-300 ${backgroundClasses} ${className}`}
    >
      {children}
    </button>
  );
};
export default ColorButton;
