import {
  createContext,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type Theme = "light" | "inverted";
type ThemeContextType = {
  theme: Theme;
  cycleThemes: () => void;
};
export const ThemeContext = createContext<ThemeContextType>(
  {} as ThemeContextType,
);

const THEMES = ["light", "inverted"] as Theme[];

const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [themeIdx, setThemeIdx] = useState(0);
  const toggleTheme = useCallback(() => {
    setThemeIdx(prev => {
      const out = prev + 1;
      return out % THEMES.length;
    });
  }, [setThemeIdx]);
  const theme = useMemo(() => THEMES[themeIdx], [themeIdx]);

  useEffect(() => {
    const invertedClass = "inverted";
    const lightClass = "light";

    if (theme === "light") {
      document.documentElement.classList.add(lightClass);
      document.documentElement.classList.remove(invertedClass);
    } else if (theme === "inverted") {
      document.documentElement.classList.add(invertedClass);
      document.documentElement.classList.remove(lightClass);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, cycleThemes: toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
export default ThemeProvider;
