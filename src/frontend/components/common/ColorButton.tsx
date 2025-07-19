import { PropsWithChildren, useMemo } from "react";

type Props = {
  variant?: "blue" | "indigo" | "red" | "green" | "gray" | "remove";
  onClick?: () => void;
  className?: string;
} & PropsWithChildren;

const ColorButton = ({ variant, onClick, className, children }: Props) => {
  const backgroundClasses = useMemo(() => {
    switch (variant) {
      case "blue":
        return "rounded-lg border border-blue-500/10 bg-blue-300/30 text-sm text-blue-400 backdrop-blur-sm font-medium";
      case "indigo":
        return "bg-indigo-600/20 text-indigo-500 hover:bg-indigo-600/30 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/30 dark:hover:text-indigo-200";
      case "red":
        return "bg-red-500 text-white hover:bg-red-500/80 dark:text-red-300 dark:hover:bg-red-500/30 dark:hover:text-red-200";
      case "gray":
        return "bg-gray-300 text-black-500 font-semibold hover:bg-blue-300/80 dark:bg-blue-500/20 dark:text-blue-500 dark:hover:bg-blue-500/30 dark:hover:text-blue-200";
        case "green":
        return " bg-gray-600 text-white hover:bg-zinc-500 dark:bg-zinc-600 dark:hover:bg-zinc-700 inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium";
      case "remove":
        return "px-6 py-2 font-medium bg-indigo-500 text-white w-fit transition-all shadow-[3px_3px_0px_black] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]";

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
