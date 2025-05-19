import { ChangeEvent } from "react";

type Props = {
  placeholder?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
};

const TextInput = ({ placeholder, value, onChange, className }: Props) => {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`rounded-lg border border-slate-600/50 bg-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/50 dark:bg-slate-700/30 dark:text-white ${className}`}
    />
  );
};

export default TextInput;
