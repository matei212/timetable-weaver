import { PropsWithChildren } from "react";

type Props = { className?: string } & PropsWithChildren;

const Note = ({ className, children }: Props) => {
  return (
    <div
      className={`rounded-lg border border-blue-500/10 bg-blue-300/30 text-sm text-blue-400 backdrop-blur-sm dark:bg-blue-900/10 dark:text-blue-300 ${className}`}
    >
      <span className="mr-2">ℹ️</span>
      {children}
    </div>
  );
};
export default Note;
