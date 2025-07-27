import { ButtonHTMLAttributes, PropsWithChildren, useMemo } from "react";

type Props = {
  variant?: "blue" | "cyan" | "red" | "colapse" | "gray";
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  onClick?: () => void;
  className?: string;
  disabled?: boolean; // Adaugă proprietatea disabled
} & PropsWithChildren;

const GradientButton = ({
  variant,
  type,
  onClick,
  className,
  children,
  disabled, // Preia proprietatea disabled
}: Props) => {
  const gradientClasses = useMemo(() => {
    // Dacă butonul este dezactivat, folosește stiluri de inactivitate
    if (disabled) {
      return "bg-gray-300 text-gray-500 cursor-not-allowed";
    }
    switch (variant) {
      case "gray":
        return " bg-gray-100 text-black hover:bg-gray-200 inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium";
      case "blue":
        return "from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-900/30";
      case "cyan":
        return "from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 hover:shadow-blue-500/30";
      case "red":
        return "from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 hover:shadow-red-500/30";
      case "colapse":
        return "bg-slate-200 text-black hover:bg-gray-400 inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium border border-black"

      default:
        return "from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:shadow-emerald-500/20";
    }
  }, [variant, disabled]); // Adaugă disabled la dependențe

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled} // Pasează disabled la elementul button
      className={`transform rounded-lg backdrop-blur-sm transition-all duration-300 ${
        !disabled ? "hover:-translate-y-0.5 hover:shadow-lg bg-gradient-to-r" : ""
      } ${gradientClasses} ${className}`}
    >
      {children}
    </button>
  );
};

export default GradientButton;
