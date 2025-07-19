import React, { useContext, useMemo } from "react";
import { ThemeContext } from "../../providers/Theme";
import { FaRegSun } from "react-icons/fa";
import { FaRegMoon } from "react-icons/fa";




const ThemeButton = () => {
    const { theme, cycleThemes } = useContext(ThemeContext);
    const icon = useMemo(() => {
      switch (theme) {
        case "light":
          return <FaRegSun color="orange" strokeWidth={1}/>;
        case "inverted":
          return <FaRegMoon />;
        default:
          return "☀️";
      }
    }, [theme]);
  
    return (
      <button
        onClick={cycleThemes}
        className="ml-auto flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm "
      >
        <span className="emoji">{icon}</span>
        <span className="capitalize">{theme === "inverted" ? "dark" : theme}</span>
      </button>
    );
  };




  export default ThemeButton;