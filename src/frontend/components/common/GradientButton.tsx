import { PropsWithChildren, useMemo } from "react";

type Props = {
  variant?: "blue" | "cyan" | "red" | "green";
  onClick?: () => void;
  className?: string;
} & PropsWithChildren;

const GradientButton = ({ variant, onClick, className, children }: Props) => {
  const gradientClasses = useMemo(() => {
    switch (variant) {
      case "blue":
        return "from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-900/30";
      case "cyan":
        return "from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 hover:shadow-blue-500/30";
      case "red":
        return "from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 hover:shadow-red-500/30";
      case "green":
      default:
        return "from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:shadow-emerald-500/20";
    }
  }, [variant]);

  return (
    <button
      onClick={onClick}
      className={`transform rounded-lg bg-gradient-to-r text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${gradientClasses} ${className}`}
    >
      {children}
    </button>
  );
};

export default GradientButton;
