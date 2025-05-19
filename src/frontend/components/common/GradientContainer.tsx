import { PropsWithChildren, useMemo } from "react";

type Props = {
  variant?: "normal" | "light";
  className?: string;
} & PropsWithChildren;

const GradientContainer = ({ variant, className, children }: Props) => {
  const gradientClasses = useMemo(() => {
    switch (variant) {
      case "light":
        return "border-slate-600/50 bg-slate-100 p-4 dark:bg-slate-700/30";
      case "normal":
      default:
        return "border-blue-500/20 bg-white to-slate-300 dark:bg-gradient-to-b dark:from-slate-800 dark:to-slate-900";
    }
  }, [variant]);

  return (
    <div
      className={`rounded-xl border shadow-xl backdrop-blur-sm ${gradientClasses} ${className}`}
    >
      {children}
    </div>
  );
};
export default GradientContainer;
