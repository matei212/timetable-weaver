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
    switch (theme) {
      case "light":
        document.documentElement.classList.remove("dark");
        break;
      case "dark":
        document.documentElement.classList.add("dark");
        break;
      case "auto":
      default: {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        if (prefersDark) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
        break;
      }
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, cycleThemes: toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
export default ThemeProvider;
