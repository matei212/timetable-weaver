import {
  createContext,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type Theme = "auto" | "dark" | "light";
type ThemeContextType = {
  theme: Theme;
  cycleThemes: () => void;
};
export const ThemeContext = createContext<ThemeContextType>(
  {} as ThemeContextType,
);

const THEMES = ["auto", "dark", "light"] as Theme[];

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
    const darkClass = "dark";
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const prefersDark = mediaQuery.matches;
      if (prefersDark) {
        document.documentElement.classList.add(darkClass);
      } else {
        document.documentElement.classList.remove(darkClass);
      }
    };

    if (theme === "auto") {
      applyTheme();
      mediaQuery.addEventListener("change", applyTheme); // Listen for changes
    } else {
      mediaQuery.removeEventListener("change", applyTheme); // Clean up in case it was listening before
      if (theme === "dark") {
        document.documentElement.classList.add(darkClass);
      } else {
        document.documentElement.classList.remove(darkClass);
      }
    }

    // Cleanup
    return () => {
      mediaQuery.removeEventListener("change", applyTheme);
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, cycleThemes: toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
export default ThemeProvider;
